import { task } from "hardhat/config";
import {
  deployNFTXVaultFactory,
  deploySushiSwapRouter,
} from "../../helpers/contracts-deployments";
import { getLendPoolAddressesProvider } from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid } from "../../helpers/types";

task(
  "full:deploy-nftx-sushiswap",
  "Deploy address provider for full enviroment"
)
  .addFlag("verify", "Verify contracts at Etherscan")
  .addFlag("skipRegistry")
  .setAction(async ({ verify, pool, skipRegistry }, DRE) => {
    await DRE.run("set-DRE");
    const addressesProvider = await getLendPoolAddressesProvider();

    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy NFTX Vault
    console.log("Deploying new NFTX Vault implementation...");
    const nftxVaultImpl = await deployNFTXVaultFactory(verify);
    console.log(
      "Setting nftxVault implementation with address:",
      nftxVaultImpl.address
    );
    // Set lend pool conf impl to Address Provider
    await waitForTx(
      await addressesProvider.setNFTXVaultFactory(nftxVaultImpl.address)
    );
    await insertContractAddressInDb(
      eContractid.NFTXVaultFactory,
      nftxVaultImpl.address
    );

    //////////////////////////////////////////////////////////////////////////
    // Reuse/deploy Sushi Vault
    console.log("Deploying new SushiSwap Router implementation...");
    const sushiSwapImpl = await deploySushiSwapRouter(verify);
    console.log(
      "Setting nftxVault implementation with address:",
      sushiSwapImpl.address
    );
    // Set lend pool conf impl to Address Provider
    await waitForTx(
      await addressesProvider.setSushiSwapRouter(sushiSwapImpl.address)
    );
    await insertContractAddressInDb(
      eContractid.SushiSwapRouter,
      sushiSwapImpl.address
    );
  });
