import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployGenericUNFTImpl,
  deployUNFTRegistry,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getConfigMockedNfts,
  getProxyAdminSigner,
  getUNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid } from "../../helpers/types";
import { MintableERC721 } from "../../types";

task("dev:deploy-mock-unft-registry", "Deploy unft registry for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const proxyAdminAddress = await (await getProxyAdminSigner()).getAddress();
    console.log(proxyAdminAddress);
    const poolConfig = loadPoolConfig(pool);

    const unftGenericImpl = await deployGenericUNFTImpl(verify);

    const unftRegistryImpl = await deployUNFTRegistry(verify);

    const initEncodedData = unftRegistryImpl.interface.encodeFunctionData(
      "initialize",
      [
        unftGenericImpl.address,
        poolConfig.Mocks.UNftNamePrefix,
        poolConfig.Mocks.UNftSymbolPrefix,
      ]
    );

    const unftRegistryProxy = await deployUnlockdUpgradeableProxy(
      eContractid.UNFTRegistry,
      proxyAdminAddress,
      unftRegistryImpl.address,
      initEncodedData,
      verify
    );
  });

task("dev:deploy-mock-unft-tokens", "Deploy unft tokens for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);

    const unftRegistryProxy = await getUNFTRegistryProxy();

    const mockedNfts = await getConfigMockedNfts(poolConfig);

    for (const [nftSymbol, mockedNft] of Object.entries(mockedNfts) as [
      string,
      MintableERC721
    ][]) {
      await waitForTx(await unftRegistryProxy.createUNFT(mockedNft.address));
      const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(
        mockedNft.address
      );
      console.log("UNFT Token:", nftSymbol, uNftProxy);
    }
  });
