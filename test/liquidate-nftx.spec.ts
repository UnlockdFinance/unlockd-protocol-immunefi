import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { oneEther } from "../helpers/constants";
import {
  convertToCurrencyDecimals,
  convertToCurrencyUnits,
} from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import {
  approveERC20,
  setApprovalForAll,
  setNftAssetPrice,
  setNftAssetPriceForDebt,
} from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation", (testEnv) => {
  let baycInitPrice: BN;

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

    //mints USDC to the liquidator
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

    //borrows
    const price = await convertToCurrencyDecimals(deployer, weth, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

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
    await configurator.setTimeframe(3600);

    const nftColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      101,
      weth.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

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
    const { weth, bayc, users, pool, nftOracle, deployer } = testEnv;
    const borrower = users[1];

    await nftOracle.setPriceManagerStatus(bayc.address, true);

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

  /* it("WETH - Liquidates the borrow on NFTX", async () => {
    const { weth, bayc, users, pool, dataProvider, liquidator, nftxVaultFactory } = testEnv;
    const borrower = users[1];

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, "101");

    const ethReserveDataBefore = await dataProvider.getReserveData(weth.address);

    const userReserveDataBefore = await getUserData(pool, dataProvider, weth.address, borrower.address);

    // end auction duration
    await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());

    const extraAmount = await convertToCurrencyDecimals(weth.address, "1");
    await pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "101");

    // check result
    const vaultsForAssets = await nftxVaultFactory.vaultsForAsset(bayc.address);
    const nftxVault = await getNFTXVault(vaultsForAssets[0]);
    const tokenOwner = await bayc.ownerOf("101");
    expect(tokenOwner).to.be.equal(nftxVault.address, "Invalid token owner after liquidation");

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(loanDataBefore.loanId);

    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const userReserveDataAfter = await getUserData(pool, dataProvider, weth.address, borrower.address);

    const ethReserveDataAfter = await dataProvider.getReserveData(weth.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
      new BigNumber(ethReserveDataAfter.variableBorrowIndex.toString())
    );

    expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
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

    expect(ethReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
      new BigNumber(ethReserveDataBefore.availableLiquidity.toString()).plus(expectedLiquidateAmount).toFixed(0),
      "Invalid principal available liquidity"
    );
  }); */

  it("USDC - Borrows USDC", async () => {
    const {
      users,
      pool,
      reserveOracle,
      usdc,
      bayc,
      uBAYC,
      configurator,
      deployer,
      nftOracle,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    await setNftAssetPrice(testEnv, "BAYC", 101, parseEther("50").toString());
    //mints USDC to the liquidator
    await fundWithERC20("USDC", depositor.address, "100000");
    await approveERC20(testEnv, depositor, "USDC");

    //deposits USDC
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      usdc,
      "100000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(usdc.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 102);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //borrows
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "102",
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
    const nftColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      102,
      usdc.address
    );

    const usdcPrice = await reserveOracle.getAssetPrice(usdc.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      usdc,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(usdcPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(
        usdc.address,
        amountBorrow.toString(),
        bayc.address,
        "102",
        borrower.address,
        "0"
      );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "102");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );

    const tokenOwner = await bayc.ownerOf("102");
    expect(tokenOwner).to.be.equal(
      uBAYC.address,
      "Invalid token owner after auction"
    );
  });

  it("USDC - Drop the health factor below 1", async () => {
    const { usdc, bayc, users, pool, nftOracle, deployer } = testEnv;
    const borrower = users[1];

    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, "102");

    const debAmountUnits = await convertToCurrencyUnits(
      deployer,
      usdc,
      nftDebtDataBefore.totalDebt.toString()
    );
    await setNftAssetPriceForDebt(
      testEnv,
      "BAYC",
      102,
      "USDC",
      debAmountUnits,
      "80"
    );

    const nftDebtDataAfter = await pool.getNftDebtData(bayc.address, "102");

    expect(nftDebtDataAfter.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0),
      ProtocolErrors.VL_INVALID_HEALTH_FACTOR
    );
  });

  /* it("USDC - Liquidates the borrow on NFTX", async () => {
    const { usdc, bayc, users, pool, dataProvider, liquidator, nftxVaultFactory } = testEnv;
    const borrower = users[1];

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(bayc.address, "102");

    const usdcReserveDataBefore = await dataProvider.getReserveData(usdc.address);

    const userReserveDataBefore = await getUserData(pool, dataProvider, usdc.address, borrower.address);

    // end auction duration
    await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());

    const extraAmount = await convertToCurrencyDecimals(usdc.address, "10");
    await pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "102");

    // check result
    const vaultsForAssets = await nftxVaultFactory.vaultsForAsset(bayc.address);
    const nftxVault = await getNFTXVault(vaultsForAssets[0]);
    const tokenOwner = await bayc.ownerOf("102");
    expect(tokenOwner).to.be.equal(nftxVault.address, "Invalid token owner after liquidation");

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(loanDataBefore.loanId);

    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const userReserveDataAfter = await getUserData(pool, dataProvider, usdc.address, borrower.address);

    const usdcReserveDataAfter = await dataProvider.getReserveData(usdc.address);

    const userVariableDebtAmountBeforeTx = new BigNumber(userReserveDataBefore.scaledVariableDebt).rayMul(
      new BigNumber(usdcReserveDataAfter.variableBorrowIndex.toString())
    );

    // expect debt amount to be liquidated
    const expectedLiquidateAmount = new BigNumber(loanDataBefore.scaledAmount.toString()).rayMul(
      new BigNumber(usdcReserveDataAfter.variableBorrowIndex.toString())
    );

    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    expect(userReserveDataAfter.currentVariableDebt.toString()).to.be.bignumber.almostEqual(
      userVariableDebtAmountBeforeTx.minus(expectedLiquidateAmount).toString(),
      "Invalid user debt after liquidation"
    );

    //the liquidity index of the principal reserve needs to be bigger than the index before
    expect(usdcReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
      usdcReserveDataBefore.liquidityIndex.toString(),
      "Invalid liquidity index"
    );

    //the principal APY after a liquidation needs to be lower than the APY before
    expect(usdcReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
      usdcReserveDataBefore.liquidityRate.toString(),
      "Invalid liquidity APY"
    );

    expect(usdcReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
      new BigNumber(usdcReserveDataBefore.availableLiquidity.toString()).plus(expectedLiquidateAmount).toFixed(0),
      "Invalid principal available liquidity"
    );
  }); */
});
