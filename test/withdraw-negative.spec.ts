import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  UnlockdPools,
} from "../helpers/types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  setApprovalForAll,
  withdraw,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Withdraw negative test cases", (testEnv: TestEnv) => {
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
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Users 0 Deposits 1000 DAI and tries to withdraw 0 DAI (revert expected)", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await fundWithERC20("DAI", user0.address, "1000");
    await approveERC20(testEnv, user0, "DAI");

    await deposit(
      testEnv,
      user0,
      "",
      "DAI",
      "1000",
      user0.address,
      "success",
      ""
    );

    await withdraw(
      testEnv,
      user0,
      "DAI",
      "0",
      "revert",
      "Amount to withdraw needs to be > 0"
    );
  });

  it("Users 0 tries to withdraw 1100 DAI from the 1000 DAI deposited (revert expected)", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(
      testEnv,
      user0,
      "DAI",
      "1100",
      "revert",
      "User cannot withdraw more than the available balance"
    );
  });

  it("Users 1 borrows 100 DAI, users 0 tries to withdraw the 1000 DAI deposited (revert expected)", async () => {
    const { users, configurator, deployer, bayc, pool } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await fundWithERC721("BAYC", user1.address, tokenIdNum);
    await setApprovalForAll(testEnv, user1, "BAYC");

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await pool
      .connect(user1.signer)
      .triggerUserCollateral(bayc.address, tokenId);
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("1000"),
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

    await borrow(
      testEnv,
      user1,
      "DAI",
      "100",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "success",
      ""
    );

    await withdraw(
      testEnv,
      user0,
      "DAI",
      "1000",
      "revert",
      "User cannot withdraw more than the available balance"
    );
  });

  it("Users 1 deposits 1 WETH, users 0 borrows 0.01 WETH, users 1 tries to withdraw the 1 WETH deposited (revert expected)", async () => {
    const { users, configurator, pool, deployer, bayc } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "1");
    await approveERC20(testEnv, user1, "WETH");

    await deposit(
      testEnv,
      user1,
      "",
      "WETH",
      "1",
      user1.address,
      "success",
      ""
    );

    // user 1 borrows 0.01 WETH
    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user0.address, tokenIdNum);
    await setApprovalForAll(testEnv, user0, "BAYC");

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await pool
      .connect(user0.signer)
      .triggerUserCollateral(bayc.address, tokenId);
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

    await borrow(
      testEnv,
      user0,
      "WETH",
      "0.01",
      "BAYC",
      tokenId,
      user0.address,
      "",
      "success",
      ""
    );

    await withdraw(
      testEnv,
      user1,
      "WETH",
      "1",
      "revert",
      "User cannot withdraw more than the available balance"
    );
  });
});
