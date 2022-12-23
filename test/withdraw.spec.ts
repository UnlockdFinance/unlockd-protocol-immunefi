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

makeSuite("LendPool: Withdraw", (testEnv: TestEnv) => {
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

  it("User 0 Deposits 1000 DAI in an empty reserve", async () => {
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
  });

  it("User 0 withdraws half of the deposited DAI", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(testEnv, user0, "DAI", "500", "success", "");
  });

  it("User 0 withdraws remaining half of the deposited DAI", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(testEnv, user0, "DAI", "-1", "success", "");
  });

  it("User 0 Deposits 1 WETH in an empty reserve", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await fundWithERC20("WETH", user0.address, "1");
    await approveERC20(testEnv, user0, "WETH");

    await deposit(
      testEnv,
      user0,
      "",
      "WETH",
      "1",
      user0.address,
      "success",
      ""
    );
  });

  it("User 0 withdraws half of the deposited WETH", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(testEnv, user0, "WETH", "0.5", "success", "");
  });

  it("User 0 withdraws remaining half of the deposited WETH", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(testEnv, user0, "WETH", "-1", "success", "");
  });

  it("Users 0 and 1 Deposit 1000 DAI, both withdraw", async () => {
    const { users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("DAI", user0.address, "1000");
    await approveERC20(testEnv, user0, "DAI");

    await fundWithERC20("DAI", user1.address, "1000");
    await approveERC20(testEnv, user1, "DAI");

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

    await deposit(
      testEnv,
      user1,
      "",
      "DAI",
      "1000",
      user1.address,
      "success",
      ""
    );

    await withdraw(testEnv, user0, "DAI", "-1", "success", "");

    await withdraw(testEnv, user1, "DAI", "-1", "success", "");
  });

  it("Users 0 deposits 1000 DAI, user 1 Deposit 1000 USDC and 1 WETH, borrows 100 DAI. User 1 tries to withdraw all the USDC", async () => {
    const { users, deployer, bayc, configurator, pool } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("DAI", user0.address, "1000");
    await approveERC20(testEnv, user0, "DAI");

    // Users 0 deposits 1000 DAI
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

    // user 1 Deposit 1000 USDC
    await fundWithERC20("USDC", user1.address, "1000");
    await approveERC20(testEnv, user1, "USDC");

    await deposit(
      testEnv,
      user1,
      "",
      "USDC",
      "1000",
      user1.address,
      "success",
      ""
    );

    // user 1 Deposit 1 WETH
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

    // user 1 borrows 100 DAI
    await fundWithERC721("BAYC", user1.address, 101);
    await setApprovalForAll(testEnv, user1, "BAYC");

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);
    await pool.connect(user1.signer).triggerUserCollateral(bayc.address, "101");
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

    await borrow(
      testEnv,
      user1,
      "WETH",
      "0.01",
      "BAYC",
      "101",
      user1.address,
      "",
      "success",
      ""
    );

    // User 1 tries to withdraw all the USDC
    await withdraw(testEnv, user1, "USDC", "-1", "success", "");
  });
});
