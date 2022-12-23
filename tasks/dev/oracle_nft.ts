import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployNFTOracle } from "../../helpers/contracts-deployments";
import {
  getAllMockedNfts,
  getLendPoolAddressesProvider,
} from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";
import {
  addAssetsInNFTOracle,
  setPricesInNFTOracle,
} from "../../helpers/oracles-helpers";
import { tEthereumAddress } from "../../helpers/types";

task("dev:deploy-oracle-nft", "Deploy nft oracle for dev environment")
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

    const addressesProvider = await getLendPoolAddressesProvider();

    const mockNfts = await getAllMockedNfts();

    const allNftAddresses = Object.entries(mockNfts).reduce(
      (
        accum: { [tokenSymbol: string]: tEthereumAddress },
        [tokenSymbol, tokenContract]
      ) => ({
        ...accum,
        [tokenSymbol]: tokenContract.address,
      }),
      {}
    );

    const allNftMaxSupply = Object.entries(
      poolConfig.Mocks.AllNftsMaxSupply
    ).reduce(
      (
        accum: { [tokenSymbol: string]: string },
        [tokenSymbol, tokenMaxSupply]
      ) => ({
        ...accum,
        [tokenSymbol]: tokenMaxSupply,
      }),
      {}
    );

    const allNftPrices = Object.entries(
      poolConfig.Mocks.AllNftsInitialPrices
    ).reduce(
      (
        accum: { [tokenSymbol: string]: string },
        [tokenSymbol, tokenPrice]
      ) => ({
        ...accum,
        [tokenSymbol]: tokenPrice,
      }),
      {}
    );

    const lendpoolConfigurator =
      await addressesProvider.getLendPoolConfigurator();

    const nftOracleImpl = await deployNFTOracle(verify);
    await waitForTx(
      await nftOracleImpl.initialize(
        await addressesProvider.getPoolAdmin(),
        lendpoolConfigurator
      ) // Fix bug! 2e17 1e17
    );

    await nftOracleImpl.setPriceManagerStatus(lendpoolConfigurator, true);

    await waitForTx(
      await addressesProvider.setNFTOracle(nftOracleImpl.address)
    );
    await addAssetsInNFTOracle(allNftAddresses, nftOracleImpl);
    await setPricesInNFTOracle(
      allNftPrices,
      allNftAddresses,
      allNftMaxSupply,
      nftOracleImpl
    );
  });
