import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployNFTXVaultFactory,
  deploySushiSwapRouter,
} from "../../helpers/contracts-deployments";

task(
  "dev:deploy-sushiswap-nftxvault-controller",
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

    console.log("-> Prepare mock external NFTXVault...");
    const nftxVaultFactory = await deployNFTXVaultFactory();
    console.log("NFTX vault address: ", nftxVaultFactory.address);

    console.log("-> Prepare mock external sushiswapRouter...");
    const sushiSwapRouter = await deploySushiSwapRouter();
    console.log("Sushiswap router address: ", sushiSwapRouter.address);
  });
