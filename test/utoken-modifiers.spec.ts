import { expect } from "chai";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

makeSuite("UToken: Modifiers", (testEnv: TestEnv) => {
  const { CT_CALLER_MUST_BE_LEND_POOL } = ProtocolErrors;

  it("Tries to invoke mint not being the Pool", async () => {
    const { deployer, uDai } = testEnv;
    await expect(uDai.mint(deployer.address, "1", "1")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke burn not being the Pool", async () => {
    const { deployer, uDai } = testEnv;
    await expect(
      uDai.burn(deployer.address, deployer.address, "1", "1")
    ).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });

  it("Tries to invoke mintToTreasury not being the Pool", async () => {
    const { deployer, users, uDai } = testEnv;
    await expect(uDai.mintToTreasury("1", "1")).to.be.revertedWith(
      CT_CALLER_MUST_BE_LEND_POOL
    );
  });

  it("Tries to invoke transferUnderlyingTo not being the Pool", async () => {
    const { deployer, uDai } = testEnv;
    await expect(
      uDai.transferUnderlyingTo(deployer.address, "1")
    ).to.be.revertedWith(CT_CALLER_MUST_BE_LEND_POOL);
  });
});
