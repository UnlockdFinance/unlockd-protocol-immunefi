import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployMockIncentivesController } from "../../helpers/contracts-deployments";

task(
  "dev:deploy-incentives-controller",
  "Deploy address provider for dev enviroment"
)
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

    console.log("-> Prepare mock external IncentivesController...");
    const incentivesController = await deployMockIncentivesController();
    console.log(
      "Incentives controller address: ",
      incentivesController.address
    );
  });
