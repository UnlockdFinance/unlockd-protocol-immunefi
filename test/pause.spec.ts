import { parseEther } from "@ethersproject/units";
import { BigNumber } from "bignumber.js";
import { getEmergencyAdminSigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  fundWithERC20,
  fundWithERC721,
  waitForTx,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

const { expect } = require("chai");

makeSuite("LendPool: Pause", (testEnv: TestEnv) => {
  before(async () => {});

  it("Transfer", async () => {
    const { users, pool, dai, uDai, configurator, deployer } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    await fundWithERC20("DAI", users[0].address, "1000");
    await approveERC20(testEnv, users[0], "DAI");

    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      dai,
      "1000"
    );

    await pool
      .connect(users[0].signer)
      .deposit(dai.address, amountDeposit, users[0].address, "0");

    const user0Balance = await uDai.balanceOf(users[0].address);
    const user1Balance = await uDai.balanceOf(users[1].address);

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // User 0 tries the transfer to User 1
    await expect(
      uDai.connect(users[0].signer).transfer(users[1].address, amountDeposit)
    ).to.revertedWith(ProtocolErrors.LP_IS_PAUSED);

    const pausedFromBalance = await uDai.balanceOf(users[0].address);
    const pausedToBalance = await uDai.balanceOf(users[1].address);

    expect(pausedFromBalance).to.be.equal(
      user0Balance.toString(),
      ProtocolErrors.INVALID_TO_BALANCE_AFTER_TRANSFER
    );
    expect(pausedToBalance.toString()).to.be.equal(
      user1Balance.toString(),
      ProtocolErrors.INVALID_FROM_BALANCE_AFTER_TRANSFER
    );

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);

    // User 0 succeeds transfer to User 1
    await uDai
      .connect(users[0].signer)
      .transfer(users[1].address, amountDeposit);

    const fromBalance = await uDai.balanceOf(users[0].address);
    const toBalance = await uDai.balanceOf(users[1].address);

    expect(fromBalance.toString()).to.be.equal(
      user0Balance.sub(amountDeposit),
      ProtocolErrors.INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    expect(toBalance.toString()).to.be.equal(
      user1Balance.add(amountDeposit),
      ProtocolErrors.INVALID_TO_BALANCE_AFTER_TRANSFER
    );
  });

  it("Deposit", async () => {
    const { users, pool, dai, uDai, configurator, deployer } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      dai,
      "1000"
    );

    await fundWithERC20("DAI", users[0].address, "1000");
    await approveERC20(testEnv, users[0], "DAI");

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);
    await expect(
      pool
        .connect(users[0].signer)
        .deposit(dai.address, amountDeposit, users[0].address, "0")
    ).to.revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Withdraw", async () => {
    const { users, pool, dai, uDai, configurator, deployer } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      dai,
      "1000"
    );

    await fundWithERC20("DAI", users[0].address, "1000");
    await approveERC20(testEnv, users[0], "DAI");

    await pool
      .connect(users[0].signer)
      .deposit(dai.address, amountDeposit, users[0].address, "0");

    // Configurator pauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // user tries to burn
    await expect(
      pool
        .connect(users[0].signer)
        .withdraw(dai.address, amountDeposit, users[0].address)
    ).to.revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Configurator unpauses the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Borrow", async () => {
    const { pool, dai, bayc, users, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const user = users[1];
    // Pause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Try to execute liquidation
    await expect(
      pool
        .connect(user.signer)
        .borrow(dai.address, "1", bayc.address, "1", user.address, "0")
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Unpause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Repay", async () => {
    const { pool, dai, bayc, users, configurator } = testEnv;
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    const user = users[1];
    // Pause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Try to execute liquidation
    await expect(
      pool.connect(user.signer).repay(bayc.address, "1", "1")
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Unpause the pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("Liquidate", async () => {
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
    const depositor = users[3];
    const borrower = users[4];
    const liquidator = users[5];
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "1000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(weth.address, amountDeposit, depositor.address, "0");

    //user 4 mints BAYC to borrower
    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 101);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    const price = await convertToCurrencyDecimals(deployer, weth, "1000");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    type NewType = IConfigNftAsCollateralInput;

    const collData: NewType = {
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
    const loanData = await pool.getNftCollateralData(
      bayc.address,
      "101",
      weth.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(loanData.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.2)
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

    // Drops HF below 1
    const baycPrice = await nftOracle.getNFTPrice(bayc.address, "101");
    await nftOracle.setNFTPrice(
      bayc.address,
      101,
      new BigNumber(baycPrice.toString()).multipliedBy(0.5).toFixed(0)
    );

    //mints WETH to the liquidator
    await fundWithERC20("WETH", liquidator.address, "1000");
    await approveERC20(testEnv, liquidator, "WETH");

    // Pause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // Do auction
    await expect(
      pool
        .connect(liquidator.signer)
        .auction(bayc.address, "101", amountBorrow, liquidator.address)
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Do redeem
    await expect(
      pool.connect(liquidator.signer).redeem(bayc.address, "101", "1", "1")
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Do liquidation
    await expect(
      pool.connect(liquidator.signer).liquidate(bayc.address, "101", "0")
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Unpause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });

  it("LiquidateNFTX", async () => {
    const {
      users,
      pool,
      nftOracle,
      reserveOracle,
      weth,
      bayc,
      configurator,
      deployer,
      liquidator,
    } = testEnv;
    const depositor = users[3];
    const borrower = users[4];
    const emergencyAdminSigner = await getEmergencyAdminSigner();

    await fundWithERC20("WETH", depositor.address, "1000");
    await approveERC20(testEnv, depositor, "WETH");

    //user 3 deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "1000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(weth.address, amountDeposit, depositor.address, "0");

    //mints BAYC to borrower
    await fundWithERC721("BAYC", borrower.address, 102);
    //approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //user 4 borrows
    const price = await convertToCurrencyDecimals(deployer, weth, "1000");
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
    const loanData = await pool.getNftCollateralData(
      bayc.address,
      102,
      weth.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(loanData.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.2)
        .toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "102",
        borrower.address,
        "0"
      );

    // Drops HF below 1
    const baycPrice = await nftOracle.getNFTPrice(bayc.address, 102);
    await nftOracle.setNFTPrice(
      bayc.address,
      102,
      new BigNumber(baycPrice.toString()).multipliedBy(0.5).toFixed(0)
    );

    //mints usdc to the liquidator
    await fundWithERC20("WETH", liquidator.address, "1000");
    await approveERC20(testEnv, liquidator, "WETH");

    // Pause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(true);

    // add  supporting liquidations on  NFTX for auction price purposes
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

    await waitForTx(
      await configurator
        .connect(deployer.signer)
        .setIsMarketSupported(bayc.address, 0, false)
    );

    // Do liquidation
    await expect(
      pool.connect(liquidator.signer).liquidateNFTX(bayc.address, "102")
    ).revertedWith(ProtocolErrors.LP_IS_PAUSED);

    // Unpause pool
    await configurator.connect(emergencyAdminSigner).setPoolPause(false);
  });
});
