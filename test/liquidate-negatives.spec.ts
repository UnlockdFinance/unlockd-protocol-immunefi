import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { ONE_DAY } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  fundWithERC20,
  fundWithERC721,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Liquidation negative test cases", (testEnv) => {
  before("Before liquidation: set config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
  });

  after("After liquidation: reset config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("User 0 deposit 100 WETH, user 1 mint NFT and borrow 10 WETH", async () => {
    const { weth, bayc, pool, users, configurator, deployer, nftOracle } =
      testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // user 0 mint and deposit 100 WETH
    await fundWithERC20("WETH", user0.address, "100");
    await approveERC20(testEnv, user0, "WETH");
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "100"
    );
    await pool
      .connect(user0.signer)
      .deposit(weth.address, amountDeposit, user0.address, "0");

    // user 1 mint NFT and borrow 10 WETH
    await fundWithERC20("WETH", user1.address, "10");
    await approveERC20(testEnv, user1, "WETH");

    await fundWithERC721("BAYC", user1.address, 101);
    await setApprovalForAll(testEnv, user1, "BAYC");

    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "10");

    const price = await convertToCurrencyDecimals(deployer, weth, "100");
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
    await pool
      .connect(user1.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        user1.address,
        "0"
      );
    // user 2, 3 mint 100 WETH
    await fundWithERC20("WETH", user2.address, "100");
    await approveERC20(testEnv, user2, "WETH");
    await fundWithERC20("WETH", user3.address, "100");
    await approveERC20(testEnv, user3, "WETH");
  });

  it("User 1 liquidate on a non-existent NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user1 = users[1];

    await expect(
      pool.connect(user1.signer).liquidate(bayc.address, "102", "0")
    ).to.be.revertedWith(ProtocolErrors.LP_NFT_IS_NOT_USED_AS_COLLATERAL);
  });
  /* Can not deactive Reserve or NFT when liquidity is not zero
  it("User 2 auction on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).auction(bayc.address, "101", "0", user2.address)).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 liquidate on a non-active NFT", async () => {
    const { configurator, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateNft(bayc.address);

    await expect(pool.connect(user2.signer).liquidate(bayc.address, "101", "0")).to.be.revertedWith(
      ProtocolErrors.VL_NO_ACTIVE_NFT
    );

    await configurator.activateNft(bayc.address);
  });

  it("User 2 auction on a non-active Reserve", async () => {
    const { configurator, weth, uWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).auction(bayc.address, '101', '0', user2.address)
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });

  it("User 2 liquidate on a non-active Reserve", async () => {
    const { configurator, weth, uWETH, bayc, pool, users } = testEnv;
    const user2 = users[2];

    await configurator.deactivateReserve(weth.address);

    await expect(
      pool.connect(user2.signer).liquidate(bayc.address, '101', '0')
    ).to.be.revertedWith(ProtocolErrors.VL_NO_ACTIVE_RESERVE);

    await configurator.activateReserve(weth.address);
  });*/

  it("User 2 auction on a loan health factor above 1", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    // NFT not supporting liquidations on sudoswap / NFTX
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
    await expect(
      pool
        .connect(user2.signer)
        .auction(bayc.address, "101", liquidatePrice, user2.address)
    ).to.be.revertedWith(
      ProtocolErrors.LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD
    );
  });

  it("Drop loan health factor below 1", async () => {
    const { bayc, nftOracle, pool, users, configurator } = testEnv;

    const poolLoanData = await pool.getNftDebtData(bayc.address, "101");
    const baycPrice = new BigNumber(poolLoanData.totalDebt.toString())
      .percentMul(new BigNumber(5000)) // 50%
      .toFixed(0);
    await advanceTimeAndBlock(100);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
  });

  it("User 2 auction price is unable to cover borrow", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    // NFT not supporting liquidations on sudoswap / NFTX
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

    await expect(
      pool
        .connect(user2.signer)
        .auction(bayc.address, "101", liquidatePrice, user2.address)
    ).to.be.revertedWith(
      ProtocolErrors.LPL_BID_PRICE_LESS_THAN_MIN_BID_REQUIRED
    );
  });

  it("User 2 auction price is less than liquidate price", async () => {
    const { weth, bayc, nftOracle, pool, users } = testEnv;
    const user2 = users[2];

    const nftColData = await pool.getNftCollateralData(
      bayc.address,
      "101",
      weth.address
    );
    const nftDebtData = await pool.getNftDebtData(bayc.address, "101");
    // Price * LH / Debt = HF => Price * LH = Debt * HF => Price = Debt * HF / LH
    // LH is 2 decimals
    const baycPrice = new BigNumber(nftDebtData.totalDebt.toString())
      .percentMul(new BigNumber(9500)) //95%
      .percentDiv(new BigNumber(nftColData.liquidationThreshold.toString()))
      .toFixed(0);

    await advanceTimeAndBlock(100);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);
    await advanceTimeAndBlock(200);
    await nftOracle.setNFTPrice(bayc.address, 101, baycPrice);

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );

    const auctionPriceFail = new BigNumber(liquidatePrice.toString())
      .multipliedBy(0.8)
      .toFixed(0);

    await expect(
      pool
        .connect(user2.signer)
        .auction(bayc.address, "101", auctionPriceFail, user2.address)
    ).to.be.revertedWith(
      ProtocolErrors.LPL_BID_PRICE_LESS_THAN_LIQUIDATION_PRICE
    );
  });

  it("User 2 auction price is enough to cover borrow and liqudiate price", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    // NFT not supporting liquidations on sudoswap / NFTX
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
    const auctionPriceOk = new BigNumber(liquidatePrice.toString())
      .multipliedBy(1.5)
      .toFixed(0);
    await waitForTx(
      await pool
        .connect(user2.signer)
        .auction(bayc.address, "101", auctionPriceOk, user2.address)
    );
  });

  it("User 3 auction price is lesser than user 2", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user3 = users[3];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    const auctionPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(1.2)
      .toFixed(0);
    // NFT not supporting liquidations on sudoswap / NFTX
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
    await expect(
      pool
        .connect(user3.signer)
        .auction(bayc.address, "101", auctionPrice, user3.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE);
  });

  it("User 2 liquidate before auction duration is end", async () => {
    const { bayc, pool, users } = testEnv;
    const user2 = users[2];

    await expect(
      pool.connect(user2.signer).liquidate(bayc.address, "101", "0")
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_AUCTION_DURATION_NOT_END);
  });

  it("User 1 redeem but bidFine is not fullfil to borrow amount of user 2 auction", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount;
    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString())
      .multipliedBy(0.9)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBidFine)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_INVALID_BID_FINE);
  });

  it("User 1 redeem but amount is not fullfil to mininum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.div(2);

    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString())
      .multipliedBy(1.1)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBidFine)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD);
  });

  it("User 1 redeem but amount is not fullfil to maximum repay amount", async () => {
    const { bayc, pool, users } = testEnv;
    const user1 = users[1];
    const user3 = users[3];

    // user 1 want redeem and query the bid fine (user 2 bid price)
    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.mul(2);

    const badBidFine = new BigNumber(nftAuctionData.bidFine.toString())
      .multipliedBy(1.1)
      .toFixed(0);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, badBidFine)
    ).to.be.revertedWith(ProtocolErrors.LP_AMOUNT_GREATER_THAN_MAX_REPAY);
  });

  it("Ends redeem duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    const nftTokenIdCfgData =
      await dataProvider.getNftConfigurationDataByTokenId(bayc.address, "101");

    await increaseTime(
      nftCfgData.redeemDuration.mul(ONE_DAY).add(100).toNumber()
    );
    await increaseTime(
      nftTokenIdCfgData.redeemDuration.mul(ONE_DAY).add(100).toNumber()
    );
  });

  it("User 1 redeem after duration is end", async () => {
    const { bayc, pool, users, dataProvider, loan } = testEnv;
    const user1 = users[1];

    const nftAuctionData = await pool.getNftAuctionData(bayc.address, "101");
    const redeemAmount = nftAuctionData.bidBorrowAmount.div(2);

    await expect(
      pool
        .connect(user1.signer)
        .redeem(bayc.address, "101", redeemAmount, nftAuctionData.bidFine)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_REDEEM_DURATION_HAS_END);
  });

  it("Ends auction duration", async () => {
    const { bayc, dataProvider } = testEnv;

    const nftCfgData = await dataProvider.getNftConfigurationData(bayc.address);
    const deltaDuration = nftCfgData.auctionDuration.sub(
      nftCfgData.redeemDuration
    );

    await increaseTime(deltaDuration.mul(ONE_DAY).add(100).toNumber());
  });

  it("User 3 auction after duration is end", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user3 = users[3];
    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    const auctionPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(2.0)
      .toFixed(0);
    // NFT not supporting liquidations on sudoswap / NFTX
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
    await expect(
      pool
        .connect(user3.signer)
        .auction(bayc.address, "101", auctionPrice, user3.address)
    ).to.be.revertedWith(ProtocolErrors.LPL_BID_AUCTION_DURATION_HAS_END);
  });

  it("User 2 auction consecutively", async () => {
    const { bayc, pool, users, configurator, deployer } = testEnv;
    const user2 = users[2];

    const { liquidatePrice } = await pool.getNftLiquidatePrice(
      bayc.address,
      "101"
    );
    const auctionPrice = new BigNumber(liquidatePrice.toString())
      .multipliedBy(2.0)
      .toFixed(0);
    // NFT not supporting liquidations on sudoswap / NFTX
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
    //Current bid is from user 2, thus, it should revert
    await expect(
      pool
        .connect(user2.signer)
        .auction(bayc.address, "101", auctionPrice, user2.address)
    ).to.be.revertedWith(ProtocolErrors.LP_CONSECUTIVE_BIDS_NOT_ALLOWED);
  });
});
