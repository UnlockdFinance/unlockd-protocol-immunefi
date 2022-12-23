import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLendPoolAddressesProvider } from "../../helpers/contracts-getters";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { CommonsConfig } from "../../markets/unlockd/commons";

task(
  "dev:set-NFTandSushiAddress",
  "Set the address of the NFTX Vault and Sushiswap router for full enviroment"
).setAction(async ({}, DRE: HardhatRuntimeEnvironment) => {
  try {
    await DRE.run("set-DRE");
    const addressesProvider = await getLendPoolAddressesProvider();

    //////////////////////////////////////////////////////////////////////////
    const NFTVaultAddress = CommonsConfig.NFTXVaultFactory.goerli.toString();
    console.log("NFTVaultFactory", NFTVaultAddress);
    if (
      NFTVaultAddress == undefined ||
      !notFalsyOrZeroAddress(NFTVaultAddress)
    ) {
      throw Error("Invalid NFT Vault address in Markets, commons.ts");
    }
    console.log("Setting NFT Vault address to address provider...");
    await waitForTx(
      await addressesProvider.setNFTXVaultFactory(NFTVaultAddress)
    );

    //////////////////////////////////////////////////////////////////////////
    const SushiswapAddress = CommonsConfig.SushiSwapRouter.goerli.toString();
    console.log("Sushiswap Address", SushiswapAddress);
    if (
      NFTVaultAddress == undefined ||
      !notFalsyOrZeroAddress(SushiswapAddress)
    ) {
      throw Error("Invalid Sushiswap router address in Markets, commons.ts");
    }
    console.log("Setting sushiswap router address to address provider...");
    await waitForTx(
      await addressesProvider.setSushiSwapRouter(SushiswapAddress)
    );
  } catch (error) {
    throw error;
  }
});
