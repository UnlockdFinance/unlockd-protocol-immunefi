import { expect } from "chai";
import { ZERO_ADDRESS } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, waitForTx } from "../helpers/misc-utils";
import { ProtocolErrors } from "../helpers/types";
import { CommonsConfig } from "../markets/unlockd/commons";
import { approveERC20 } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("UToken", (testEnv: TestEnv) => {
  const {
    INVALID_FROM_BALANCE_AFTER_TRANSFER,
    INVALID_TO_BALANCE_AFTER_TRANSFER,
  } = ProtocolErrors;

  afterEach("Reset", () => {
    testEnv.mockIncentivesController.resetHandleActionIsCalled();
  });

  it("Check DAI basic parameters", async () => {
    const { dai, uDai, pool } = testEnv;

    const symbol = await dai.symbol();
    const bSymbol = await uDai.symbol();
    expect(bSymbol).to.be.equal(CommonsConfig.UTokenSymbolPrefix + symbol);

    //const name = await dai.name();
    const bName = await uDai.name();
    expect(bName).to.be.equal(CommonsConfig.UTokenNamePrefix + " " + symbol);

    const decimals = await dai.decimals();
    const bDecimals = await uDai.decimals();
    expect(decimals).to.be.equal(bDecimals);

    const treasury = await uDai.RESERVE_TREASURY_ADDRESS();
    expect(treasury).to.be.not.equal(ZERO_ADDRESS);

    const underAsset = await uDai.UNDERLYING_ASSET_ADDRESS();
    expect(underAsset).to.be.equal(dai.address);

    const wantPool = await uDai.POOL();
    expect(wantPool).to.be.equal(pool.address);
  });

  it("User 0 deposits 1000 DAI, transfers uDai to user 1", async () => {
    const { users, pool, dai, uDai, deployer } = testEnv;

    await fundWithERC20("DAI", users[0].address, "1000");
    await approveERC20(testEnv, users[0], "DAI");

    //user 1 deposits 1000 DAI
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      dai,
      "1000"
    );

    await pool
      .connect(users[0].signer)
      .deposit(dai.address, amountDeposit, users[0].address, "0");

    await waitForTx(
      await testEnv.mockIncentivesController.resetHandleActionIsCalled()
    );

    await uDai
      .connect(users[0].signer)
      .transfer(users[1].address, amountDeposit);

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // expect(checkResult).to.be.equal(true, "IncentivesController not called");

    const fromBalance = await uDai.balanceOf(users[0].address);
    const toBalance = await uDai.balanceOf(users[1].address);

    expect(fromBalance.toString()).to.be.equal(
      "0",
      INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    expect(toBalance.toString()).to.be.equal(
      amountDeposit.toString(),
      INVALID_TO_BALANCE_AFTER_TRANSFER
    );
  });

  it("User 1 receive uDai from user 0, transfers 50% to user 2", async () => {
    const { users, pool, dai, uDai } = testEnv;

    const amountTransfer = (await uDai.balanceOf(users[1].address)).div(2);

    await uDai
      .connect(users[1].signer)
      .transfer(users[2].address, amountTransfer);

    const fromBalance = await uDai.balanceOf(users[1].address);
    const toBalance = await uDai.balanceOf(users[2].address);

    expect(fromBalance.toString()).to.be.equal(
      amountTransfer.toString(),
      INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    expect(toBalance.toString()).to.be.equal(
      amountTransfer.toString(),
      INVALID_TO_BALANCE_AFTER_TRANSFER
    );

    await uDai.totalSupply();
    await uDai.getScaledUserBalanceAndSupply(users[1].address);
  });
});
