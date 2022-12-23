import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import {
  ConfigNames,
  getTreasuryAddress,
  loadPoolConfig,
} from "../helpers/configuration";
import { MAX_UINT_AMOUNT, oneEther, ONE_DAY } from "../helpers/constants";
import {
  convertToCurrencyDecimals,
  convertToCurrencyUnits,
  getEthersSignerByAddress,
} from "../helpers/contracts-helpers";
import {
  fundWithERC20,
  fundWithERC721,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  ProtocolErrors,
  ProtocolLoanState,
} from "../helpers/types";
import { SelfdestructTransferFactory } from "../types";
import {
  approveERC20,
  setApprovalForAll,
  setNftAssetPriceForDebt,
} from "./helpers/actions";
import { LSSVMPairWithID, makeSuite } from "./helpers/make-suite";
import { getUserData } from "./helpers/utils/helpers";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation on SudoSwap", (testEnv) => {
  it("WETH - Borrows WETH", async () => {
    const {
      users,
      pool,
      nftOracle,
      reserveOracle,
      weth,
      bayc,
      configurator,
      deployer,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    //mints WETH to the depositor
    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "1000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    const price = await convertToCurrencyDecimals(deployer, weth, "50");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);
    //borrows
    const nftColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      101,
      weth.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "1");

    await pool
      .connect(borrower.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        borrower.address,
        "0"
      );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("WETH - Drop the health factor below 1", async () => {
    const { weth, bayc, users, pool, nftOracle, configurator, deployer } =
      testEnv;
    const borrower = users[1];

    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "101");

    const debAmountUnits = await convertToCurrencyUnits(
      deployer,
      weth,
      nftDebtDataBefore.totalDebt.toString()
    );
    await setNftAssetPriceForDebt(
      testEnv,
      "BAYC",
      101,
      "WETH",
      debAmountUnits,
      "80"
    );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("WETH - Liquidates the borrow on SudoSwap", async () => {
    const {
      weth,
      bayc,
      users,
      pool,
      dataProvider,
      deployer,
      LSSVMPairs,
      configurator,
      addressesProvider,
      uWETH,
    } = testEnv;
    const liquidator = users[3];
    const borrower = users[1];

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );

    const ethReserveDataBefore = await dataProvider.getReserveData(
      weth.address
    );

    const userReserveDataBefore = await getUserData(
      pool,
      dataProvider,
      weth.address,
      borrower.address
    );

    // end auction duration
    await increaseTime(
      nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber()
    );

    const extraAmount = await convertToCurrencyDecimals(deployer, weth, "1");

    // Select SudoSwap pair to liquidate loan on
    const LSSVMPairsWithId: LSSVMPairWithID[] = LSSVMPairs.filter(
      (pair) => pair.collectionName == "BAYC"
    );
    let topPrice = BN.from(0);
    let topPair;
    for (const pair of LSSVMPairsWithId) {
      const buyNFTQuote = await pair.LSSVMPair.getBuyNFTQuote(1);
      if (buyNFTQuote.newSpotPrice.gt(topPrice)) {
        topPrice = buyNFTQuote.newSpotPrice;
        topPair = pair.LSSVMPair;
      }
    }

    // NFT supporting liquidations on sudoswap
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, true)
    );

    await waitForTx(
      await addressesProvider
        .connect(deployer.signer)
        .setLendPoolLiquidator(liquidator.address)
    );

    // Send ETH to pair to pay protocol fee
    const selfdestructContract = await new SelfdestructTransferFactory(
      deployer.signer
    ).deploy();
    // Selfdestruct the mock, pointing to token owner address
    await waitForTx(
      await selfdestructContract.destroyAndTransfer(topPair.address, {
        value: parseEther("10"),
      })
    );
    const owner = await bayc.ownerOf(101);
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const treasuryAddress = await getTreasuryAddress(poolConfig);
    const treasurySigner = await getEthersSignerByAddress(treasuryAddress);

    // Allow pool to transfer treasury tokens in case SudoSwap sold price is less than borrowed amount
    const tx = await weth
      .connect(treasurySigner)
      .approve(pool.address, MAX_UINT_AMOUNT);
    await fundWithERC20("WETH", treasuryAddress, "10");
    await pool
      .connect(liquidator.signer)
      .liquidateSudoSwap(bayc.address, "101", topPair.address);

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(
      loanDataBefore.loanId
    );

    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Defaulted,
      "Invalid loan state after liquidation"
    );

    const userReserveDataAfter = await getUserData(
      pool,
      dataProvider,
      weth.address,
      borrower.address
    );

    const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(
      userReserveDataBefore.scaledVariableDebt
    ).rayMul(new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString()));

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(
      loanDataBefore.scaledAmount.toString()
    ).rayMul(new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString()));

    expect(
      userReserveDataAfter.currentVariableDebt.toString()
    ).to.be.bignumber.almostEqual(
      userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
      "Invalid user debt after liquidation"
    );

    //the liquidity index of the principal reserve needs to be bigger than the index before
    expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
      ethReserveDataBefore.liquidityIndex.toString(),
      "Invalid liquidity index"
    );

    //the principal APY after a liquidation needs to be lower than the APY before
    expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
      ethReserveDataBefore.liquidityRate.toString(),
      "Invalid liquidity APY"
    );

    expect(
      ethReserveDataAfter.availableLiquidity.toString()
    ).to.be.bignumber.almostEqual(
      new BigNumber(ethReserveDataBefore.availableLiquidity.toString())
        .plus(expectedLiquidateAmount)
        .toFixed(0),
      "Invalid principal available liquidity"
    );
  });

  it("DAI - Borrows DAI", async () => {
    const {
      users,
      pool,
      nftOracle,
      reserveOracle,
      dai,
      bayc,
      configurator,
      deployer,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    //mints WETH to the depositor
    await fundWithERC20("DAI", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "DAI");

    //deposits WETH
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      dai,
      "1000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(dai.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    const price = await convertToCurrencyDecimals(deployer, dai, "50");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);
    //borrows
    const nftColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      101,
      dai.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(dai.address);

    const amountBorrow = await convertToCurrencyDecimals(deployer, dai, "1");

    await pool
      .connect(borrower.signer)
      .borrow(
        dai.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        borrower.address,
        "0"
      );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("DAI - Drop the health factor below 1", async () => {
    const { dai, bayc, users, pool, nftOracle, configurator, deployer } =
      testEnv;
    const borrower = users[1];

    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "101");

    const debAmountUnits = await convertToCurrencyUnits(
      deployer,
      dai,
      nftDebtDataBefore.totalDebt.toString()
    );
    await setNftAssetPriceForDebt(
      testEnv,
      "BAYC",
      101,
      "DAI",
      debAmountUnits,
      "80"
    );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "101");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  it("DAI - Liquidates the borrow on SudoSwap", async () => {
    const {
      dai,
      bayc,
      users,
      pool,
      dataProvider,
      deployer,
      LSSVMPairs,
      configurator,
      addressesProvider,
      uWETH,
    } = testEnv;
    const liquidator = users[3];
    const borrower = users[1];

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );

    const ethReserveDataBefore = await dataProvider.getReserveData(dai.address);

    const userReserveDataBefore = await getUserData(
      pool,
      dataProvider,
      dai.address,
      borrower.address
    );

    // end auction duration
    await increaseTime(
      nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber()
    );

    const extraAmount = await convertToCurrencyDecimals(deployer, dai, "1");

    // Select SudoSwap pair to liquidate loan on
    const LSSVMPairsWithId: LSSVMPairWithID[] = LSSVMPairs.filter(
      (pair) => pair.collectionName == "BAYC"
    );
    let topPrice = BN.from(0);
    let topPair;
    for (const pair of LSSVMPairsWithId) {
      const buyNFTQuote = await pair.LSSVMPair.getBuyNFTQuote(1);
      if (buyNFTQuote.newSpotPrice.gt(topPrice)) {
        topPrice = buyNFTQuote.newSpotPrice;
        topPair = pair.LSSVMPair;
      }
    }

    // NFT supporting liquidations on sudoswap
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, true)
    );

    await waitForTx(
      await addressesProvider
        .connect(deployer.signer)
        .setLendPoolLiquidator(liquidator.address)
    );

    // Send ETH to pair to pay protocol fee
    const selfdestructContract = await new SelfdestructTransferFactory(
      deployer.signer
    ).deploy();
    // Selfdestruct the mock, pointing to token owner address
    await waitForTx(
      await selfdestructContract.destroyAndTransfer(topPair.address, {
        value: parseEther("10"),
      })
    );
    const owner = await bayc.ownerOf(101);
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const treasuryAddress = await getTreasuryAddress(poolConfig);
    const treasurySigner = await getEthersSignerByAddress(treasuryAddress);

    // Allow pool to transfer treasury tokens in case SudoSwap sold price is less than borrowed amount
    const tx = await dai
      .connect(treasurySigner)
      .approve(pool.address, MAX_UINT_AMOUNT);
    await fundWithERC20("DAI", treasuryAddress, "10");
    await pool
      .connect(liquidator.signer)
      .liquidateSudoSwap(bayc.address, "101", topPair.address);

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(
      loanDataBefore.loanId
    );

    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Defaulted,
      "Invalid loan state after liquidation"
    );

    const userReserveDataAfter = await getUserData(
      pool,
      dataProvider,
      dai.address,
      borrower.address
    );

    const ethReserveDataAfter = await dataProvider.getReserveData(dai.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(
      userReserveDataBefore.scaledVariableDebt
    ).rayMul(new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString()));

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(
      loanDataBefore.scaledAmount.toString()
    ).rayMul(new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString()));

    expect(
      userReserveDataAfter.currentVariableDebt.toString()
    ).to.be.bignumber.almostEqual(
      userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
      "Invalid user debt after liquidation"
    );

    //the liquidity index of the principal reserve needs to be bigger than the index before
    expect(ethReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
      ethReserveDataBefore.liquidityIndex.toString(),
      "Invalid liquidity index"
    );

    //the principal APY after a liquidation needs to be lower than the APY before
    expect(ethReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
      ethReserveDataBefore.liquidityRate.toString(),
      "Invalid liquidity APY"
    );

    expect(
      ethReserveDataAfter.availableLiquidity.toString()
    ).to.be.bignumber.almostEqual(
      new BigNumber(ethReserveDataBefore.availableLiquidity.toString())
        .plus(expectedLiquidateAmount)
        .toFixed(0),
      "Invalid principal available liquidity"
    );
  });
});
