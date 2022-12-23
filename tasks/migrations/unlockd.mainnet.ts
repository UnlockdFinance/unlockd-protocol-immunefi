import { formatEther } from "@ethersproject/units";
import { task } from "hardhat/config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../../helpers/configuration";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../../helpers/contracts-helpers";
import { checkVerification } from "../../helpers/etherscan-verification";
import { printContracts } from "../../helpers/misc-utils";

task("unlockd:mainnet", "Deploy full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addFlag(
    "skipRegistry",
    "Skip addresses provider registration at Addresses Provider Registry"
  )
  .addFlag("skipOracle", "Skip deploy oracles")
  .setAction(async ({ verify, skipRegistry, skipOracle }, DRE) => {
    const POOL_NAME = ConfigNames.Unlockd;
    await DRE.run("set-DRE");
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

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log("\n\nMigration started");

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

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy Incentives Controller");
    await DRE.run("full:deploy-incentives-controller", { verify: verify });

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy UNFT Registry");
    await DRE.run("full:deploy-unft-registry", {
      pool: POOL_NAME,
      verify,
      createunfts: false,
    });

    //////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////
    console.log("\n\nDeploy lend pool");
    await DRE.run("full:deploy-lend-pool", { pool: POOL_NAME, verify: verify });

    console.log("\n\nDeploy reserve oracle");
    await DRE.run("full:deploy-oracle-reserve", {
      pool: POOL_NAME,
      skipOracle,
      verify: verify,
    });

    console.log("\n\nDeploy nft oracle");
    await DRE.run("full:deploy-oracle-nft", {
      pool: POOL_NAME,
      skipOracle,
      verify: verify,
    });

    ////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize lend pool");
    await DRE.run("full:initialize-lend-pool", {
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
    await DRE.run("full:deploy-punk-gateway", {
      pool: POOL_NAME,
      verify: verify,
    });

    // //////////////////////////////////////////////////////////////////////////
    console.log("\n\nInitialize gateway");
    await DRE.run("full:initialize-gateway", {
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

    /* if (verify) {
      printContracts();

      console.log("\n\nVeryfing general contracts");
      await DRE.run("verify:general", { all: true, pool: POOL_NAME });

      console.log("\n\nVeryfing reserves contracts");
      await DRE.run("verify:reserves", { pool: POOL_NAME });

      console.log("\n\nVeryfing nfts contracts");
      await DRE.run("verify:nfts", { pool: POOL_NAME });
    } */

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
