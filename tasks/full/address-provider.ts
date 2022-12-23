import { task } from "hardhat/config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../../helpers/configuration";
import { deployLendPoolAddressesProvider } from "../../helpers/contracts-deployments";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task(
  "full:deploy-address-provider",
  "Deploy address provider for full enviroment"
)
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("skipRegistry")
  .setAction(async ({ verify, pool, skipRegistry }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const signer = await getDeploySigner();

    // this contract is not support upgrade, just deploy new contract
    // Deploy address provider and set genesis manager
    console.log("- Deploying new Address Provider:");
    const addressesProvider = await deployLendPoolAddressesProvider(
      poolConfig.MarketId,
      verify
    );

    // Add to registry or setup a new one
    if (!skipRegistry) {
      const providerRegistryAddress = getParamPerNetwork(
        poolConfig.ProviderRegistry,
        <eNetwork>DRE.network.name
      );

      await DRE.run("add-market-to-registry", {
        pool,
        addressesProvider: addressesProvider.address,
        deployRegistry: !notFalsyOrZeroAddress(providerRegistryAddress),
      });
    }
    const sushiSwapRouterAddress = getParamPerNetwork(
      poolConfig.SushiSwapRouter,
      <eNetwork>DRE.network.name
    );
    if (
      sushiSwapRouterAddress == undefined ||
      !notFalsyOrZeroAddress(sushiSwapRouterAddress)
    ) {
      throw Error("Invalid SushiSwap Router address in pool config");
    }

    const nftxVaultFactoryAddress = getParamPerNetwork(
      poolConfig.NFTXVaultFactory,
      <eNetwork>DRE.network.name
    );

    if (
      nftxVaultFactoryAddress == undefined ||
      !notFalsyOrZeroAddress(nftxVaultFactoryAddress)
    ) {
      throw Error("Invalid NFTX Vault Factory address in pool config");
    }

    const LSSVMRouterAddress = getParamPerNetwork(
      poolConfig.LSSVMRouter,
      <eNetwork>DRE.network.name
    );
    console.log("LSSVM ROUTER ADDRESS: " + LSSVMRouterAddress);
    if (
      LSSVMRouterAddress == undefined ||
      !notFalsyOrZeroAddress(LSSVMRouterAddress)
    ) {
      throw Error("Invalid LSVVM Router address in pool config");
    }

    // Set pool admins
    await waitForTx(
      await addressesProvider.setPoolAdmin(
        await getGenesisPoolAdmin(poolConfig)
      )
    );
    await waitForTx(
      await addressesProvider.setEmergencyAdmin(
        await getEmergencyAdmin(poolConfig)
      )
    );
    await waitForTx(
      await addressesProvider.setLendPoolLiquidator(
        await getLendPoolLiquidator(poolConfig)
      )
    );

    await waitForTx(
      await addressesProvider.setSushiSwapRouter(sushiSwapRouterAddress)
    );
    await waitForTx(
      await addressesProvider.setNFTXVaultFactory(nftxVaultFactoryAddress)
    );
    await waitForTx(await addressesProvider.setLSSVMRouter(LSSVMRouterAddress));

    console.log("Pool Admin", await addressesProvider.getPoolAdmin());
    console.log("Emergency Admin", await addressesProvider.getEmergencyAdmin());
    console.log(
      "LendPool Liquidator",
      await addressesProvider.getLendPoolLiquidator()
    );

    console.log(
      "SushiSwap Router",
      await addressesProvider.getSushiSwapRouter()
    );
    console.log(
      "NFTXVault Factory",
      await addressesProvider.getNFTXVaultFactory()
    );
  });
