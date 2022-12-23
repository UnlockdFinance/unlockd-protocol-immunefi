import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20 } from "../helpers/misc-utils";
import {
  IReserveParams,
  iUnlockdPoolAssets,
  UnlockdPools,
} from "../helpers/types";
import {
  configuration as actionsConfiguration,
  getERC20Balance,
  setPoolRescuer,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Rescue locked funds", (testEnv: TestEnv) => {
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

  it("User 1 transfers 100 DAI directly to pool, and rescuer returns funds", async () => {
    const { users, pool, dai } = testEnv;
    const rescuer = users[0];
    const user1 = users[1];

    await fundWithERC20("DAI", user1.address, "1000");
    const initialBalance = await getERC20Balance(testEnv, user1, "DAI");
    console.log(initialBalance);

    await dai
      .connect(user1.signer)
      .transfer(
        pool.address,
        await convertToCurrencyDecimals(user1, dai, "100")
      );
    //Set new rescuer
    await setPoolRescuer(testEnv, rescuer);

    await testEnv.pool
      .connect(rescuer.signer)
      .rescue(
        dai.address,
        user1.address,
        await convertToCurrencyDecimals(rescuer, dai, "100"),
        false
      );

    //await rescue(testEnv, rescuer, user1, "DAI", "100", false);

    const finalBalance = await getERC20Balance(testEnv, user1, "DAI");

    expect(initialBalance).to.be.equal(
      finalBalance,
      "Tokens not rescued properly"
    );
  });
  it("Prevents a random user from rescuing tokens ", async () => {
    const { users, pool, dai } = testEnv;
    const fakeRescuer = users[0];
    const realRescuer = users[1];
    const recipient = users[2];

    await fundWithERC20("DAI", fakeRescuer.address, "1000");
    const initialBalance = await getERC20Balance(testEnv, fakeRescuer, "DAI");
    console.log(initialBalance);

    //Set new rescuer
    await setPoolRescuer(testEnv, realRescuer);
    await expect(
      testEnv.pool
        .connect(fakeRescuer.signer)
        .rescue(
          dai.address,
          fakeRescuer.address,
          await convertToCurrencyDecimals(realRescuer, dai, "100"),
          false
        )
    ).to.be.revertedWith("Rescuable: caller is not the rescuer");
  });
});
