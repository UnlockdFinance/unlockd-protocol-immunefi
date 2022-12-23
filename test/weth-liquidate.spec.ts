import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { MAX_UINT_AMOUNT, oneEther, ONE_DAY } from "../helpers/constants";
import { getDebtToken } from "../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  convertToCurrencyUnits,
} from "../helpers/contracts-helpers";
import {
  fundWithERC721,
  getNowTimeInSeconds,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  ProtocolLoanState,
  UnlockdPools,
} from "../helpers/types";
import {
  configuration as actionsConfiguration,
  setApprovalForAll,
  setApprovalForAllWETHGateway,
  setNftAssetPrice,
  setNftAssetPriceForDebt,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const chai = require("chai");
const { expect } = chai;

makeSuite("WETHGateway - Liquidate", (testEnv: TestEnv) => {
  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <
      iUnlockdPoolAssets<IReserveParams>
    >getReservesConfigByPool(UnlockdPools.proto);
  });
  after("Reset configuration", async () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });

    await setNftAssetPrice(testEnv, "BAYC", 101, parseEther("50").toString());
  });

  it("Borrow ETH and Liquidate it", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      reserveOracle,
      nftOracle,
      weth,
      uWETH,
      bayc,
      dataProvider,
      configurator,
      deployer,
    } = testEnv;
    const depositor = users[0];
    const user = users[1];
    const user3 = users[3];
    const liquidator = users[4];

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    {
      const latestTime = await getNowTimeInSeconds();
      await waitForTx(
        await nftOracle.setNFTPrice(bayc.address, tokenId, parseEther("50"))
      );
    }

    // Deposit with native ETH
    await wethGateway
      .connect(depositor.signer)
      .depositETH(depositor.address, "0", { value: parseEther("20") });

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(
      await debtToken
        .connect(user.signer)
        .approveDelegation(wethGateway.address, MAX_UINT_AMOUNT)
    );

    // Start loan

    await fundWithERC721("BAYC", user.address, tokenIdNum);
    await setApprovalForAll(testEnv, user, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, user, "BAYC");

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    const nftColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      tokenId,
      weth.address
    );

    const price = await convertToCurrencyDecimals(deployer, weth, "50");

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
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

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);
    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    // Borrow with NFT
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .borrowETH(amountBorrow, bayc.address, tokenId, user.address, "0")
    );

    const nftDebtDataAfterBorrow = await pool.getNftDebtData(
      bayc.address,
      tokenId
    );
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0)
    );

    // Drop the health factor below 1
    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, tokenId);
    const debAmountUnits = await convertToCurrencyUnits(
      deployer,
      weth,
      nftDebtDataBefore.totalDebt.toString()
    );
    await setNftAssetPriceForDebt(
      testEnv,
      "BAYC",
      tokenIdNum,
      "WETH",
      debAmountUnits,
      "80"
    );

    const nftDebtDataBeforeAuction = await pool.getNftDebtData(
      bayc.address,
      tokenId
    );
    expect(nftDebtDataBeforeAuction.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0)
    );

    // Liquidate ETH loan with native ETH
    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      tokenId
    );
    const auctionAmountSend = new BigNumber(liquidatePrice.toString())
      .multipliedBy(10)
      .toFixed(0);

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 0, false)
    );
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, false)
    );

    await waitForTx(
      await wethGateway
        .connect(liquidator.signer)
        .auctionETH(bayc.address, tokenId, liquidator.address, {
          value: auctionAmountSend,
        })
    );

    await increaseTime(
      nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber()
    );

    await increaseTime(new BigNumber(ONE_DAY).multipliedBy(365).toNumber()); // accrue more interest, debt exceed bid price

    const loanDataBeforeLiquidate = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      tokenId
    );
    const extraAmount = new BigNumber(
      loanDataBeforeLiquidate.currentAmount
        .sub(loanDataBeforeLiquidate.bidPrice)
        .toString()
    )
      .multipliedBy(1.1)
      .toFixed(0);

    await waitForTx(
      await wethGateway
        .connect(liquidator.signer)
        .liquidateETH(bayc.address, tokenId)
    );
    const loanDataAfter = await dataProvider.getLoanDataByLoanId(
      nftDebtDataBeforeAuction.loanId
    );
    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Defaulted,
      "Invalid loan state after liquidation"
    );

    const tokenOwner = await bayc.ownerOf(tokenId);
    expect(tokenOwner).to.be.equal(
      liquidator.address,
      "Invalid token owner after liquidation"
    );
  });

  /* it("Borrow ETH and Liquidate it on NFTX", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      reserveOracle,
      nftOracle,
      weth,
      uWETH,
      bayc,
      dataProvider,
      liquidator,
      nftxVaultFactory,
    } = testEnv;
    const depositor = users[0];
    const user = users[1];
    const user3 = users[3];

    {
      const latestTime = await getNowTimeInSeconds();
      const currTokenId = testEnv.tokenIdTracker;
      await waitForTx(await nftOracle.setNFTPrice(bayc.address, currTokenId, baycInitPrice));
    }

    // Deposit with native ETH
    console.log("depositETH:", depositSize);
    await wethGateway.connect(depositor.signer).depositETH(depositor.address, "0", { value: depositSize });

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(await debtToken.connect(user.signer).approveDelegation(wethGateway.address, MAX_UINT_AMOUNT));

    // Start loan
    const nftAsset = await getNftAddressFromSymbol("BAYC");
    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await mintERC721(testEnv, user, "BAYC", tokenId);
    await setApprovalForAll(testEnv, user, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, user, "BAYC");

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(nftAsset, tokenId);

    const nftColDataBefore = await pool.getNftCollateralData(nftAsset, tokenId, weth.address);

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);
    const amountBorrow = await convertToCurrencyDecimals(
      weth.address,
      new BigNumber(nftColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    // Borrow with NFT
    console.log("borrowETH:", amountBorrow);
    await waitForTx(
      await wethGateway.connect(user.signer).borrowETH(amountBorrow, nftAsset, tokenId, user.address, "0", 0)
    );
    const nftDebtDataAfterBorrow = await pool.getNftDebtData(bayc.address, tokenId);
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(oneEther.toFixed(0));

    // Drop the health factor below 1
    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, tokenId);
    const debAmountUnits = await convertToCurrencyUnits(weth.address, nftDebtDataBefore.totalDebt.toString());
    await setNftAssetPriceForDebt(testEnv, "BAYC", tokenIdNum, "WETH", debAmountUnits, "80");

    const nftDebtDataBeforeAuction = await pool.getNftDebtData(bayc.address, tokenId);
    expect(nftDebtDataBeforeAuction.healthFactor.toString()).to.be.bignumber.lt(oneEther.toFixed(0));

    await increaseTime(nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber());

    await increaseTime(new BigNumber(ONE_DAY).multipliedBy(365).toNumber()); // accrue more interest, debt exceed bid price

    const loanDataBeforeLiquidate = await dataProvider.getLoanDataByCollateral(nftAsset, tokenId);
    const extraAmount = new BigNumber(loanDataBeforeLiquidate.currentAmount.toString()).multipliedBy(1.1).toFixed(0);
    console.log("liquidateNFTX:", "extraAmount:", extraAmount);
    await waitForTx(await wethGateway.connect(liquidator.signer).liquidateNFTX(nftAsset, tokenId));

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(nftDebtDataBeforeAuction.loanId);
    expect(loanDataAfter.state).to.be.equal(ProtocolLoanState.Defaulted, "Invalid loan state after liquidation");

    const tokenOwner = await bayc.ownerOf(tokenId);
    const vaultsForAssets = await nftxVaultFactory.vaultsForAsset(bayc.address);
    const nftxVault = await getNFTXVault(vaultsForAssets[0]);
    expect(tokenOwner).to.be.equal(nftxVault.address, "Invalid token owner after liquidation");
  }); */

  it("Borrow ETH and Redeem it", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      reserveOracle,
      nftOracle,
      weth,
      uWETH,
      bayc,
      uBAYC,
      dataProvider,
      liquidator,
      deployer,
      configurator,
    } = testEnv;
    const depositor = users[0];
    const user = users[1];
    const user3 = users[3];

    // Deposit with native ETH
    await wethGateway
      .connect(depositor.signer)
      .depositETH(depositor.address, "0", { value: parseEther("20") });

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(
      await debtToken
        .connect(user.signer)
        .approveDelegation(wethGateway.address, MAX_UINT_AMOUNT)
    );

    // Start loan

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user.address, tokenIdNum);
    await setApprovalForAll(testEnv, user, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, user, "BAYC");

    const nftCfgData = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await pool
      .connect(user.signer)
      .triggerUserCollateral(bayc.address, tokenId);
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 5000,
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
      tokenId,
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

    // Borrow with NFT
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .borrowETH(amountBorrow, bayc.address, tokenId, user.address, "0")
    );
    const nftDebtDataAfterBorrow = await pool.getNftDebtData(
      bayc.address,
      tokenId
    );
    expect(nftDebtDataAfterBorrow.healthFactor.toString()).to.be.bignumber.gt(
      oneEther.toFixed(0)
    );

    // Drop the health factor below 1
    const nftDebtDataBefore = await pool.getNftDebtData(bayc.address, tokenId);
    const debAmountUnits = await convertToCurrencyUnits(
      deployer,
      weth,
      nftDebtDataBefore.totalDebt.toString()
    );
    await setNftAssetPriceForDebt(
      testEnv,
      "BAYC",
      tokenIdNum,
      "WETH",
      debAmountUnits,
      "80"
    );

    const nftDebtDataBeforeAuction = await pool.getNftDebtData(
      bayc.address,
      tokenId
    );
    expect(nftDebtDataBeforeAuction.healthFactor.toString()).to.be.bignumber.lt(
      oneEther.toFixed(0)
    );

    // Liquidate ETH loan with native ETH
    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      tokenId
    );
    const liquidateAmountSend = liquidatePrice.add(
      liquidatePrice.mul(5).div(100)
    );
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 0, false)
    );
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, false)
    );
    await waitForTx(
      await wethGateway
        .connect(liquidator.signer)
        .auctionETH(bayc.address, tokenId, liquidator.address, {
          value: liquidateAmountSend,
        })
    );

    // Redeem ETH loan with native ETH
    await increaseTime(nftCfgData.auctionDuration.mul(24).sub(1).toNumber());
    const auctionData = await pool.getNftAuctionData(bayc.address, tokenId);
    const bidFineAmount = new BigNumber(auctionData.bidFine.toString())
      .multipliedBy(1.1)
      .toFixed(0);
    const repayAmount = new BigNumber(auctionData.bidBorrowAmount.toString())
      .multipliedBy(0.51)
      .toFixed(0);
    const redeemAmountSend = new BigNumber(repayAmount)
      .plus(bidFineAmount)
      .toFixed(0);
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .redeemETH(bayc.address, tokenId, repayAmount, bidFineAmount, {
          value: redeemAmountSend,
        })
    );

    const loanDataAfterRedeem = await dataProvider.getLoanDataByLoanId(
      nftDebtDataAfterBorrow.loanId
    );
    expect(loanDataAfterRedeem.state).to.be.equal(
      ProtocolLoanState.Active,
      "Invalid loan state after redeem"
    );

    const tokenOwnerAfterRedeem = await bayc.ownerOf(tokenId);
    expect(tokenOwnerAfterRedeem).to.be.equal(
      uBAYC.address,
      "Invalid token owner after redeem"
    );

    // Repay loan
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .repayETH(bayc.address, tokenId, redeemAmountSend, {
          value: redeemAmountSend,
        })
    );

    const loanDataAfterRepay = await dataProvider.getLoanDataByLoanId(
      nftDebtDataAfterBorrow.loanId
    );
    expect(loanDataAfterRepay.state).to.be.equal(
      ProtocolLoanState.Repaid,
      "Invalid loan state after repay"
    );

    const tokenOwnerAfterRepay = await bayc.ownerOf(tokenId);
    expect(tokenOwnerAfterRepay).to.be.equal(
      user.address,
      "Invalid token owner after repay"
    );
  });
});
