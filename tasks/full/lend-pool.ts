import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  ConfigNames,
  getEmergencyAdmin,
  loadPoolConfig,
} from "../../helpers/configuration";
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
  getMockIncentivesController,
  getUNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import {
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";

task("full:deploy-lend-pool", "Deploy lend pool for full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, DRE: HardhatRuntimeEnvironment) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      console.log("LENDPOOL");
      const poolConfig = loadPoolConfig(pool);
      const addressesProvider = await getLendPoolAddressesProvider();
      console.log("ADDRESSES PROVIDED: ", addressesProvider);
      //////////////////////////////////////////////////////////////////////////
      // let unftRegistryAddress = getParamPerNetwork(poolConfig.UNFTRegistry, network);

      // if (unftRegistryAddress == undefined || !notFalsyOrZeroAddress(unftRegistryAddress)) {

      //   throw Error("Invalid UNFT Registry address in pool config");
      // }
      const unftRegistryProxy = await getUNFTRegistryProxy();
      if (
        unftRegistryProxy == undefined ||
        !notFalsyOrZeroAddress(unftRegistryProxy.address)
      ) {
        throw Error("Invalid UNFT Registry proxy in deployed contracts");
      }
      console.log("Setting UNFTRegistry to address provider...");
      await waitForTx(
        await addressesProvider.setUNFTRegistry(unftRegistryProxy.address)
      );

      //Reserves Init & NFTs Init need IncentivesController
      let incentivesControllerAddress = getParamPerNetwork(
        poolConfig.IncentivesController,
        network
      );

      if (
        incentivesControllerAddress == undefined ||
        !notFalsyOrZeroAddress(incentivesControllerAddress)
      ) {
        console.log(
          "Invalid Incentives Controller address in pool config. Trying to fetch from deployed contracts..."
        );
        incentivesControllerAddress = await (
          await getMockIncentivesController()
        ).address;
        if (
          incentivesControllerAddress == undefined ||
          !notFalsyOrZeroAddress(incentivesControllerAddress)
        ) {
          throw Error(
            "Invalid IncentivesController address in both pool config and deployed contracts"
          );
        }
      }
      console.log("Setting IncentivesController to address provider...");
      await waitForTx(
        await addressesProvider.setIncentivesController(
          incentivesControllerAddress
        )
      );

      //////////////////////////////////////////////////////////////////////////
      console.log("Deploying new libraries implementation...");
      await deployUnlockdLibraries(verify);

      // Reuse/deploy lend pool implementation
      console.log("Deploying new lend pool implementation ...");
      const lendPoolImpl = await deployLendPool(verify);
      console.log(
        "Setting lend pool implementation with address:",
        lendPoolImpl.address
      );
      // Set lending pool impl to Address provider
      await waitForTx(
        await addressesProvider.setLendPoolImpl(lendPoolImpl.address, [])
      );

      const address = await addressesProvider.getLendPool();
      const lendPoolProxy = await getLendPool(address);

      await insertContractAddressInDb(
        eContractid.LendPool,
        lendPoolProxy.address
      );

      ////////////////////////////////////////////////////////////////////////
      //Reuse/deploy lend pool loan
      console.log("Deploying new loan implementation...");
      const lendPoolLoanImpl = await deployLendPoolLoan(verify);
      console.log(
        "Setting lend pool loan implementation with address:",
        lendPoolLoanImpl.address
      );
      //Set lend pool conf impl to Address Provider
      await waitForTx(
        await addressesProvider.setLendPoolLoanImpl(
          lendPoolLoanImpl.address,
          []
        )
      );

      const lendPoolLoanProxy = await getLendPoolLoanProxy(
        await addressesProvider.getLendPoolLoan()
      );

      await insertContractAddressInDb(
        eContractid.LendPoolLoan,
        lendPoolLoanProxy.address
      );

      //////////////////////////////////////////////////////////////////////////
      //Reuse/deploy lend pool configurator
      console.log("Deploying new configurator implementation...");
      const lendPoolConfiguratorImpl = await deployLendPoolConfigurator(verify);
      console.log(
        "Setting lend pool configurator implementation with address:",
        lendPoolConfiguratorImpl.address
      );
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

      ////////////////////////////////////////////////////////////////////////
      const admin = await DRE.ethers.getSigner(
        await getEmergencyAdmin(poolConfig)
      );
      // Pause market during deployment
      await waitForTx(
        await lendPoolConfiguratorProxy.connect(admin).setPoolPause(true)
      );
      // Generic UToken & DebtToken Implementation in Pool
      await deployUTokenImplementations(
        pool,
        poolConfig.ReservesConfig,
        verify
      );

      // Generic UNFT Implementation in UNFT step, not here
      //await deployUNFTImplementations(pool, poolConfig.NftsConfig, verify);
    } catch (error) {
      console.log(error);
    }
  });
