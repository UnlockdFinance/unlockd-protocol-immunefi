import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import {
  fundWithERC20,
  fundWithERC721,
  waitForTx,
} from "../helpers/misc-utils";
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
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Deposit", (testEnv: TestEnv) => {
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

    await waitForTx(
      await testEnv.mockIncentivesController.resetHandleActionIsCalled()
    );

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

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // expect(checkResult).to.be.equal(true, "IncentivesController not called");
  });

  it("User 1 deposits 1000 DAI after user 0", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await fundWithERC20("DAI", user1.address, "1000");
    await approveERC20(testEnv, user1, "DAI");

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
  });

  it("User 0 deposits 1000 USDC in an empty reserve", async () => {
    const { users } = testEnv;
    const user0 = users[1];

    await fundWithERC20("USDC", user0.address, "1000");
    await approveERC20(testEnv, user0, "USDC");

    await deposit(
      testEnv,
      user0,
      "",
      "USDC",
      "1000",
      user0.address,
      "success",
      ""
    );
  });

  it("User 1 deposits 1000 USDC after user 0", async () => {
    const { users } = testEnv;
    const user1 = users[1];

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
  });

  it("User 0 deposits 1 WETH in an empty reserve", async () => {
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

  it("User 1 deposits 1 WETH after user 0", async () => {
    const { users } = testEnv;
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
  });

  it("User 1 deposits 0 WETH (revert expected)", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "1");
    await approveERC20(testEnv, user1, "WETH");
    await deposit(
      testEnv,
      user1,
      "",
      "WETH",
      "0",
      user1.address,
      "revert",
      "Amount must be greater than 0"
    );
  });

  it("User 1 deposits 0 DAI (revert expected)", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await fundWithERC20("DAI", user1.address, "1");
    await approveERC20(testEnv, user1, "DAI");

    await deposit(
      testEnv,
      user1,
      "",
      "DAI",
      "0",
      user1.address,
      "revert",
      "Amount must be greater than 0"
    );
  });

  it("User 1 deposits 100 DAI on behalf of user 2, user 2 tries to borrow 0.01 WETH", async () => {
    const { users, configurator, deployer, bayc } = testEnv;
    const user1 = users[1];
    const user2 = users[2];

    await fundWithERC20("DAI", user1.address, "100");
    await approveERC20(testEnv, user1, "DAI");

    await deposit(
      testEnv,
      user1,
      "",
      "DAI",
      "100",
      user2.address,
      "success",
      ""
    );

    await fundWithERC721("BAYC", user2.address, 101);
    await setApprovalForAll(testEnv, user2, "BAYC");

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
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
      user2,
      "WETH",
      "0.01",
      "BAYC",
      "101",
      user2.address,
      "",
      "success",
      ""
    );
  });
});
