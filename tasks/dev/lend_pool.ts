import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployLendPool,
  deployLendPoolConfigurator,
  deployLendPoolLoan,
  deployUnlockdLibraries,
  deployUTokenImplementations,
} from "../../helpers/contracts-deployments";
import {
  getLendPool,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getUNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid } from "../../helpers/types";

task("dev:deploy-lend-pool", "Deploy lend pool for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");
    const addressesProvider = await getLendPoolAddressesProvider();
    const poolConfig = loadPoolConfig(pool);

    const unftRegistryProxy = await getUNFTRegistryProxy();
    await waitForTx(
      await addressesProvider.setUNFTRegistry(unftRegistryProxy.address)
    );

    ////////////////////////////////////////////////////////////////////////////
    console.log("Deploying new libraries implementation...");
    await deployUnlockdLibraries(verify);

    // deploy lend pool
    const lendPoolImpl = await deployLendPool(verify);

    // Set lend pool impl to Address Provider
    await waitForTx(
      await addressesProvider.setLendPoolImpl(lendPoolImpl.address, [])
    );

    const address = await addressesProvider.getLendPool();
    const lendPoolProxy = await getLendPool(address);

    await insertContractAddressInDb(
      eContractid.LendPool,
      lendPoolProxy.address
    );

    ////////////////////////////////////////////////////////////////////////////
    // deploy lend pool configurator
    const lendPoolConfiguratorImpl = await deployLendPoolConfigurator(verify);

    //Set lend pool conf impl to Address Provider
    await waitForTx(
      await addressesProvider.setLendPoolConfiguratorImpl(
        lendPoolConfiguratorImpl.address,
        []
      )
    );

    const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );
    await insertContractAddressInDb(
      eContractid.LendPoolConfigurator,
      lendPoolConfiguratorProxy.address
    );

    ////////////////////////////////////////////////////////////////////////////
    //deploy lend pool loan
    const lendPoolLoanImpl = await deployLendPoolLoan(verify);

    // Set lend pool conf impl to Address Provider
    await waitForTx(
      await addressesProvider.setLendPoolLoanImpl(lendPoolLoanImpl.address, [])
    );

    const lendPoolLoanProxy = await getLendPoolLoanProxy(
      await addressesProvider.getLendPoolLoan()
    );
    await insertContractAddressInDb(
      eContractid.LendPoolLoan,
      lendPoolLoanProxy.address
    );

    // Generic UNFT Implementation at here
    await deployUTokenImplementations(pool, poolConfig.ReservesConfig, verify);

    // Generic UNFT Implementation in UNFT step, not here
    // await deployUNFTImplementations(pool, poolConfig.NftsConfig, verify);
  });
