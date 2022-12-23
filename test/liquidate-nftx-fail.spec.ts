import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { oneEther, ONE_DAY } from "../helpers/constants";
import {
  convertToCurrencyDecimals,
  convertToCurrencyUnits,
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
import {
  approveERC20,
  setApprovalForAll,
  setNftAssetPrice,
  setNftAssetPriceForDebt,
} from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";
import { getUserData } from "./helpers/utils/helpers";

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

    //mints WETH to depositor
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

    await fundWithERC721("BAYC", borrower.address, 101);
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

  it("WETH - Auctions the borrow", async () => {
    const {
      weth,
      bayc,
      uBAYC,
      users,
      pool,
      dataProvider,
      configurator,
      deployer,
    } = testEnv;
    const liquidator = users[3];
    const borrower = users[1];

    //mints WETH to the liquidator
    await fundWithERC20("WETH", liquidator.address, "1000");
    await approveERC20(testEnv, liquidator, "WETH");

    const lendpoolBalanceBefore = await weth.balanceOf(pool.address);

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "101"
    );

    // accurate borrow index, increment interest to loanDataBefore.scaledAmount
    await increaseTime(100);

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    const auctionPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(1.1)
      .toFixed(0);

    // remove  supporting liquidations on sudoswap / NFTX for auction price purposes
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
    await pool
      .connect(liquidator.signer)
      .auction(bayc.address, "101", auctionPrice, liquidator.address);

    // check result
    const tokenOwner = await bayc.ownerOf("101");
    expect(tokenOwner).to.be.equal(
      uBAYC.address,
      "Invalid token owner after auction"
    );

    const lendpoolBalanceAfter = await weth.balanceOf(pool.address);
    expect(lendpoolBalanceAfter).to.be.equal(
      lendpoolBalanceBefore.add(auctionPrice),
      "Invalid liquidator balance after auction"
    );

    const auctionDataAfter = await pool.getNftAuctionData(bayc.address, "101");
    expect(auctionDataAfter.bidPrice).to.be.equal(
      auctionPrice,
      "Invalid loan bid price after auction"
    );
    expect(auctionDataAfter.bidderAddress).to.be.equal(
      liquidator.address,
      "Invalid loan bidder address after auction"
    );

    const loanDataAfter = await dataProvider.getLoanDataByLoanId(
      loanDataBefore.loanId
    );
    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Auction,
      "Invalid loan state after acution"
    );
  });

  it("WETH - Can't liquidate on NFTX due to invalid loan state", async () => {
    const {
      weth,
      bayc,
      users,
      pool,
      dataProvider,
      liquidator,
      configurator,
      deployer,
    } = testEnv;
    const borrower = users[1];
    // NFT  supporting liquidations on NFTX
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 0, true)
    );
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, true)
    );

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);

    // end auction duration
    await increaseTime(
      nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber()
    );

    await expect(
      pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "101")
    ).to.be.revertedWith(ProtocolErrors.LPL_INVALID_LOAN_STATE);
  });

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

    await nftOracle.setPriceManagerStatus(bayc.address, true);

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

  it("USDC - Auctions the borrow at first time", async () => {
    const {
      usdc,
      bayc,
      uBAYC,
      users,
      pool,
      dataProvider,
      configurator,
      deployer,
    } = testEnv;
    const liquidator = users[3];
    const borrower = users[1];

    //mints USDC to the liquidator
    await fundWithERC20("USDC", liquidator.address, "100000");
    await approveERC20(testEnv, liquidator, "USDC");

    const lendpoolBalanceBefore = await usdc.balanceOf(pool.address);

    // accurate borrow index, increment interest to loanDataBefore.scaledAmount
    await increaseTime(100);

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "102"
    );
    const auctionPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(1.1)
      .toFixed(0);
    // remove  supporting liquidations on sudoswap / NFTX for auction price purposes
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

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
    await pool
      .connect(liquidator.signer)
      .auction(bayc.address, "102", auctionPrice, liquidator.address);

    // check result
    const tokenOwner = await bayc.ownerOf("102");
    expect(tokenOwner).to.be.equal(
      uBAYC.address,
      "Invalid token owner after auction"
    );

    const lendpoolBalanceAfter = await usdc.balanceOf(pool.address);
    expect(lendpoolBalanceAfter).to.be.equal(
      lendpoolBalanceBefore.add(auctionPrice),
      "Invalid liquidator balance after auction"
    );

    const auctionDataAfter = await pool.getNftAuctionData(bayc.address, "102");
    expect(auctionDataAfter.bidPrice).to.be.equal(
      auctionPrice,
      "Invalid loan bid price after auction"
    );
    expect(auctionDataAfter.bidderAddress).to.be.equal(
      liquidator.address,
      "Invalid loan bidder address after auction"
    );

    const loanDataAfter = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "102"
    );
    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Auction,
      "Invalid loan state after acution"
    );
  });

  it("USDC - Auctions the borrow at second time with higher price", async () => {
    const {
      usdc,
      bayc,
      uBAYC,
      users,
      pool,
      dataProvider,
      deployer,
      configurator,
    } = testEnv;
    const liquidator3 = users[3];
    const liquidator4 = users[4];

    //mints USDC to the liquidator
    await fundWithERC20("USDC", liquidator4.address, "150000");
    await approveERC20(testEnv, liquidator4, "USDC");

    const liquidator3BalanceBefore = await usdc.balanceOf(liquidator3.address);

    const auctionDataBefore = await pool.getNftAuctionData(bayc.address, "102");

    const auctionPrice = new BigNumber(auctionDataBefore.bidPrice.toString())
      .multipliedBy(1.2)
      .toFixed(0);

    // remove  supporting liquidations on sudoswap / NFTX for auction price purposes
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

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

    await pool
      .connect(liquidator4.signer)
      .auction(bayc.address, "102", auctionPrice, liquidator4.address);

    // check result
    const liquidator3BalanceAfter = await usdc.balanceOf(liquidator3.address);
    expect(liquidator3BalanceAfter).to.be.equal(
      liquidator3BalanceBefore.add(auctionDataBefore.bidPrice),
      "Invalid liquidator balance after auction"
    );

    const auctionDataAfter = await pool.getNftAuctionData(bayc.address, "102");
    expect(auctionDataAfter.bidPrice).to.be.equal(
      auctionPrice,
      "Invalid loan bid price after auction"
    );
    expect(auctionDataAfter.bidderAddress).to.be.equal(
      liquidator4.address,
      "Invalid loan bidder address after auction"
    );

    const loanDataAfter = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "102"
    );
    expect(loanDataAfter.state).to.be.equal(
      ProtocolLoanState.Auction,
      "Invalid loan state after acution"
    );
  });

  it("USDC - Can't liquidate on NFTX", async () => {
    const {
      usdc,
      bayc,
      users,
      pool,
      dataProvider,
      liquidator,
      configurator,
      deployer,
    } = testEnv;
    const borrower = users[1];

    // NFT  supporting liquidations on NFTX
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 0, true)
    );
    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 1, true)
    );
    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);

    const loanDataBefore = await dataProvider.getLoanDataByCollateral(
      bayc.address,
      "102"
    );

    const usdcReserveDataBefore = await dataProvider.getReserveData(
      usdc.address
    );

    const userReserveDataBefore = await getUserData(
      pool,
      dataProvider,
      usdc.address,
      borrower.address
    );

    // end auction duration
    await increaseTime(
      nftCfgData.auctionDuration.mul(ONE_DAY).add(100).toNumber()
    );

    const extraAmount = await convertToCurrencyDecimals(deployer, usdc, "10");
    await expect(
      pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "102")
    ).to.be.revertedWith(ProtocolErrors.LPL_INVALID_LOAN_STATE);
  });
});
