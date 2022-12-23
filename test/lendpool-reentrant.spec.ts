import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { MAX_UINT_AMOUNT } from "../helpers/constants";
import { getDeploySigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput } from "../helpers/types";
import { MaliciousHackerERC721, MaliciousHackerERC721Factory } from "../types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("LendPool: Malicious Hacker Rentrant", (testEnv) => {
  let maliciousHackerErc721: MaliciousHackerERC721;

  before("Before: set config", async () => {
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    maliciousHackerErc721 = await new MaliciousHackerERC721Factory(
      await getDeploySigner()
    ).deploy(testEnv.pool.address);
  });

  after("After: reset config", async () => {
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Malicious hacker try to reentrant (should revert)", async () => {
    const { weth, bayc, pool, users, configurator, deployer, nftOracle } =
      testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const user2 = users[2];
    const user3 = users[3];

    // delegates borrowing power
    await maliciousHackerErc721.approveDelegate(weth.address, borrower.address);

    // depositor mint and deposit 100 WETH
    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "100"
    );
    await pool
      .connect(depositor.signer)
      .deposit(weth.address, amountDeposit, depositor.address, "0");

    // borrower mint NFT and borrow 10 WETH
    await fundWithERC20("WETH", borrower.address, "5");
    await approveERC20(testEnv, borrower, "WETH");

    await fundWithERC721("BAYC", borrower.address, 101);
    await setApprovalForAll(testEnv, borrower, "BAYC");
    const amountBorrow = await convertToCurrencyDecimals(deployer, weth, "10");
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
    await pool
      .connect(borrower.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        maliciousHackerErc721.address,
        "0"
      );

    // borrower repay and hacker try to do reentrant action
    console.log("hacker do reentrant action: ACTION_DEPOSIT");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_DEPOSIT()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_WITHDRAW");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_WITHDRAW()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_BORROW");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_BORROW()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_REPAY");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_REPAY()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_AUCTION");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_AUCTION()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_REDEEM");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_REDEEM()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    console.log("hacker do reentrant action: ACTION_LIQUIDATE_NFTX");
    await maliciousHackerErc721.simulateAction(
      await maliciousHackerErc721.ACTION_LIQUIDATE_NFTX()
    );
    await expect(
      pool.connect(borrower.signer).repay(bayc.address, "101", MAX_UINT_AMOUNT)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });
});
