import { expect } from "chai";
import { ethers } from "ethers";
import { deployLendPool } from "../helpers/contracts-deployments";
import { createRandomAddress, waitForTx } from "../helpers/misc-utils";
import { ProtocolErrors } from "../helpers/types";
import { makeSuite, TestEnv } from "./helpers/make-suite";

const { utils } = ethers;

makeSuite("LendPoolAddressesProvider", (testEnv: TestEnv) => {
  it("Test the accessibility of the LendPoolAddressesProvider", async () => {
    const { addressesProvider, users } = testEnv;
    const mockAddress = createRandomAddress();
    const { INVALID_OWNER_REVERT_MSG } = ProtocolErrors;

    await addressesProvider.transferOwnership(users[1].address);

    for (const contractFunction of [
      addressesProvider.setMarketId,
      addressesProvider.setUNFTRegistry,
      addressesProvider.setReserveOracle,
      addressesProvider.setNFTOracle,
      addressesProvider.setPoolAdmin,
      addressesProvider.setEmergencyAdmin,
      addressesProvider.setIncentivesController,
      addressesProvider.setUIDataProvider,
      addressesProvider.setUnlockdDataProvider,
      addressesProvider.setWalletBalanceProvider,
    ]) {
      await expect(contractFunction(mockAddress)).to.be.revertedWith(
        INVALID_OWNER_REVERT_MSG
      );
    }

    await expect(
      addressesProvider.setAddress(
        utils.keccak256(utils.toUtf8Bytes("RANDOM_ID")),
        mockAddress
      )
    ).to.be.revertedWith(INVALID_OWNER_REVERT_MSG);

    await expect(
      addressesProvider.setAddressAsProxy(
        utils.keccak256(utils.toUtf8Bytes("RANDOM_ID")),
        mockAddress,
        []
      )
    ).to.be.revertedWith(INVALID_OWNER_REVERT_MSG);

    await expect(
      addressesProvider.setLendPoolImpl(mockAddress, [])
    ).to.be.revertedWith(INVALID_OWNER_REVERT_MSG);

    await expect(
      addressesProvider.setLendPoolLoanImpl(mockAddress, [])
    ).to.be.revertedWith(INVALID_OWNER_REVERT_MSG);

    await expect(
      addressesProvider.setLendPoolConfiguratorImpl(mockAddress, [])
    ).to.be.revertedWith(INVALID_OWNER_REVERT_MSG);
  });

  it("Tests adding a proxied address with `setAddressAsProxy()`", async () => {
    const { addressesProvider, users } = testEnv;
    const { INVALID_OWNER_REVERT_MSG } = ProtocolErrors;

    const currentAddressesProviderOwner = users[1];

    const mockLendPool = await deployLendPool();
    const proxiedAddressId = utils.keccak256(
      utils.toUtf8Bytes("RANDOM_PROXIED")
    );

    const proxiedAddressSetReceipt = await waitForTx(
      await addressesProvider
        .connect(currentAddressesProviderOwner.signer)
        .setAddressAsProxy(proxiedAddressId, mockLendPool.address, [])
    );

    if (
      !proxiedAddressSetReceipt.events ||
      proxiedAddressSetReceipt.events?.length < 1
    ) {
      throw new Error("INVALID_EVENT_EMMITED");
    }

    await expect(proxiedAddressSetReceipt.events[2].event).to.be.equal(
      "ProxyCreated"
    );
    await expect(proxiedAddressSetReceipt.events[3].event).to.be.equal(
      "AddressSet"
    );
    await expect(proxiedAddressSetReceipt.events[3].args?.id).to.be.equal(
      proxiedAddressId
    );
    await expect(
      proxiedAddressSetReceipt.events[3].args?.newAddress
    ).to.be.equal(mockLendPool.address);
    await expect(proxiedAddressSetReceipt.events[3].args?.hasProxy).to.be.equal(
      true
    );
  });

  it("Tests adding a non proxied address with `setAddress()`", async () => {
    const { addressesProvider, users } = testEnv;
    const { INVALID_OWNER_REVERT_MSG } = ProtocolErrors;

    const currentAddressesProviderOwner = users[1];
    const mockNonProxiedAddress = createRandomAddress();
    const nonProxiedAddressId = utils.keccak256(
      utils.toUtf8Bytes("RANDOM_NON_PROXIED")
    );

    const nonProxiedAddressSetReceipt = await waitForTx(
      await addressesProvider
        .connect(currentAddressesProviderOwner.signer)
        .setAddress(nonProxiedAddressId, mockNonProxiedAddress)
    );

    await expect(mockNonProxiedAddress.toLowerCase()).to.be.equal(
      (await addressesProvider.getAddress(nonProxiedAddressId)).toLowerCase()
    );

    if (
      !nonProxiedAddressSetReceipt.events ||
      nonProxiedAddressSetReceipt.events?.length < 1
    ) {
      throw new Error("INVALID_EVENT_EMMITED");
    }

    await expect(nonProxiedAddressSetReceipt.events[0].event).to.be.equal(
      "AddressSet"
    );
    await expect(nonProxiedAddressSetReceipt.events[0].args?.id).to.be.equal(
      nonProxiedAddressId
    );
    await expect(
      nonProxiedAddressSetReceipt.events[0].args?.newAddress
    ).to.be.equal(mockNonProxiedAddress);
    await expect(
      nonProxiedAddressSetReceipt.events[0].args?.hasProxy
    ).to.be.equal(false);
  });
});
