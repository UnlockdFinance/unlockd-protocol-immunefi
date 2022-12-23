import { formatEther } from "@ethersproject/units";
import { task } from "hardhat/config";
import { FORK } from "../../hardhat.config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../../helpers/configuration";
import { WETH_GOERLI, WETH_MAINNET } from "../../helpers/constants";
import {
  deployCryptoPunksMarket,
  deployMockChainlinkOracle,
  deployMockNFTOracle,
  deployMockReserveOracle,
  deployWrappedPunk,
} from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
} from "../../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../../helpers/contracts-helpers";
import { checkVerification } from "../../helpers/etherscan-verification";
import { printContracts, waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";

task("unlockd:fork", "Deploy a mock enviroment for testnets")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addFlag(
    "skipRegistry",
    "Skip addresses provider registration at Addresses Provider Registry"
  )
  .addFlag("skipOracle", "Skip deploy oracles")
  .setAction(async ({ verify, skipRegistry, skipOracle }, DRE) => {
    const POOL_NAME = ConfigNames.Unlockd;
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(POOL_NAME);

    const deployerSigner = await getDeploySigner();
    const poolAdminSigner = await getEthersSignerByAddress(
      await getGenesisPoolAdmin(poolConfig)
    );
    const emergencyAdminSigner = await getEthersSignerByAddress(
      await getEmergencyAdmin(poolConfig)
    );
    const lendPoolLiquidatorSigner = await getEthersSignerByAddress(
      await getLendPoolLiquidator(poolConfig)
    );

    console.log(
      "Deployer:",
      await deployerSigner.getAddress(),
      "Balance:",
      formatEther(await deployerSigner.getBalance()),
      "ETH"
    );
    console.log(
      "PoolAdmin:",
      await poolAdminSigner.getAddress(),
      "Balance:",
      formatEther(await poolAdminSigner.getBalance()),
      "ETH"
    );
    console.log(
      "EmergencyAdmin:",
      await emergencyAdminSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance()),
      "ETH"
    );
    console.log(
      "LendPool Liquidator:",
      await lendPoolLiquidatorSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance()),
      "ETH"
    );

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log("\n\nMigration started");

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Punks Market and Wrapped Punk");

    const cryptoPunksMarket = await deployCryptoPunksMarket([], verify);
    const wpunk = await deployWrappedPunk([cryptoPunksMarket.address]);
    await waitForTx(await cryptoPunksMarket.allInitialOwnersAssigned());

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy proxy admin");
    await DRE.run("full:deploy-proxy-admin", {
      pool: POOL_NAME,
      verify: verify,
    });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy address provider");
    await DRE.run("full:deploy-address-provider", {
      pool: POOL_NAME,
      skipRegistry: skipRegistry,
      verify: verify,
    });
    const addressesProvider = await getLendPoolAddressesProvider();

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Incentives Controller");
    await DRE.run("full:deploy-incentives-controller", { verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy UNFT Registry");
    await DRE.run("fork:deploy-unft-registry", {
      pool: POOL_NAME,
      verify,
      createunfts: true,
    });

    //////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy lend pool");
    await DRE.run("full:deploy-lend-pool", { pool: POOL_NAME, verify: verify });

    // Unpause lendpool after safe pause on deployment
    const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );

    await waitForTx(
      await lendPoolConfiguratorProxy
        .connect(emergencyAdminSigner)
        .setPoolPause(false)
    );

    await waitForTx(
      await lendPoolConfiguratorProxy
        .connect(poolAdminSigner)
        .setTimeframe(3600000)
    );

    console.log("\n\nDeploy reserve oracle");
    await DRE.run("full:deploy-oracle-reserve", {
      pool: POOL_NAME,
      skipOracle,
      verify: verify,
    });

    console.log("-> Deploy mock reserve oracle...");
    const mockReserveOracleImpl = await deployMockReserveOracle([]);
    await waitForTx(
      await mockReserveOracleImpl.initialize(
        FORK === "goerli" ? WETH_GOERLI : WETH_MAINNET
      )
    );

    console.log("-> Deploy mock ChainLink oracle...");
    await deployMockChainlinkOracle("18", false); // Dummy aggregator for test

    console.log("\n\nDeploy nft oracle");
    await DRE.run("full:deploy-oracle-nft", {
      pool: POOL_NAME,
      skipOracle,
      verify: verify,
    });

    console.log("-> Prepare mock nft oracle...");

    const lendPoolConfigurator = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );
    const mockNftOracleImpl = await deployMockNFTOracle();
    await waitForTx(
      await mockNftOracleImpl.initialize(
        await addressesProvider.getPoolAdmin(),
        lendPoolConfigurator.address
      )
    );

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize lend pool");
    await DRE.run("fork:initialize-lend-pool", {
      pool: POOL_NAME,
      verify: verify,
    });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy WETH Gateway");
    await DRE.run("full:deploy-weth-gateway", {
      pool: POOL_NAME,
      verify: verify,
    });

    console.log("\n\nDeploy PUNK Gateway"); // MUST AFTER WETH GATEWAY
    await DRE.run("fork:deploy-punk-gateway", {
      pool: POOL_NAME,
      verify: verify,
    });

    // //////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize gateway");
    await DRE.run("fork:initialize-gateway", {
      pool: POOL_NAME,
      verify: verify,
    });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy data provider");
    await DRE.run("full:deploy-data-provider", {
      pool: POOL_NAME,
      wallet: true,
      ui: true,
      protocol: true,
      verify: verify,
    });

    console.log("\n\nFinished migrations");
    printContracts();

    console.log(
      "Deployer:",
      await deployerSigner.getAddress(),
      "Balance:",
      formatEther(await deployerSigner.getBalance())
    );
    console.log(
      "PoolAdmin:",
      await poolAdminSigner.getAddress(),
      "Balance:",
      formatEther(await poolAdminSigner.getBalance())
    );
    console.log(
      "EmergencyAdmin:",
      await emergencyAdminSigner.getAddress(),
      "Balance:",
      formatEther(await emergencyAdminSigner.getBalance())
    );
    console.log(
      "LendPoolLiquidator:",
      await lendPoolLiquidatorSigner.getAddress(),
      "Balance:",
      formatEther(await lendPoolLiquidatorSigner.getBalance())
    );
  });
