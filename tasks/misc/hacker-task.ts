import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  getDeploySigner,
  getLendPoolAddressesProvider,
} from "../../helpers/contracts-getters";
import { eNetwork } from "../../helpers/types";

// LendPool malicious hacker tasks
task("hacker:deploy-lendpool-selfdestruct", "Doing LendPool selfdestruct task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ pool }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const deployerSigner = await getDeploySigner();
    const deployerAddress = await deployerSigner.getAddress();

    console.log("OK");
  });
