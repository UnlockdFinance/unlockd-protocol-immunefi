import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployGenericUNFTImpl,
  deployUNFTRegistry,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getUNFTRegistryProxy,
  getUnlockdProxyAdminPool,
  getWrappedPunk,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("fork:deploy-unft-registry", "Deploy unft registry ")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("createunfts", `Create UNFTS via the UNFT registry`)
  .setAction(async ({ verify, pool, createunfts }, DRE) => {
    await DRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;
    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy UnftRegistry Vault
    console.log("Deploying new UnftRegistry implementation...");
    const uNFTGenericImpl = await deployGenericUNFTImpl(verify);

    const unftRegistryImpl = await deployUNFTRegistry(verify);
    const initEncodedData = unftRegistryImpl.interface.encodeFunctionData(
      "initialize",
      [uNFTGenericImpl.address, "Unlockd Bound NFT", "UBound"]
    );

    let proxyAdminAddress = getParamPerNetwork(
      poolConfig.ProxyAdminPool,
      network
    );

    if (
      proxyAdminAddress == undefined ||
      !notFalsyOrZeroAddress(proxyAdminAddress)
    ) {
      console.log(
        "Invalid Proxy Admin address in pool config. Trying to fetch from deployed contracts..."
      );
      proxyAdminAddress = await (await getUnlockdProxyAdminPool()).address;
      if (
        proxyAdminAddress == undefined ||
        !notFalsyOrZeroAddress(proxyAdminAddress)
      ) {
        throw Error(
          "Invalid Proxy Admin address in both pool config and deployed contracts"
        );
      }
    }

    await deployUnlockdUpgradeableProxy(
      eContractid.UNFTRegistry,
      proxyAdminAddress,
      unftRegistryImpl.address,
      initEncodedData,
      verify
    );

    const unftRegistryProxy = await getUNFTRegistryProxy(
      unftRegistryImpl.addresses
    );

    const addressProvider = await getLendPoolAddressesProvider();
    await waitForTx(
      await addressProvider.setUNFTRegistry(unftRegistryProxy.address)
    );

    if (createunfts) {
      let tokens = await getParamPerNetwork(poolConfig.NftsAssets, network);
      tokens["WPUNKS"] = await (await getWrappedPunk()).address;
      for (const [tokenSymbol, tokenAddress] of Object.entries(tokens)) {
        await waitForTx(await unftRegistryProxy.createUNFT(tokenAddress));
        console.log(
          "UNFT created successfully for token " +
            tokenSymbol +
            " with address " +
            tokenAddress
        );
        const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(
          tokenAddress
        );
        console.log("UNFT Token:", tokenAddress, uNftProxy);
      }
    }
  });
