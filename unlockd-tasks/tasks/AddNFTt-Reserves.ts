import { task } from "hardhat/config";
import {
  deployCryptoPunksMarket,
  deployCustomERC721,
  deployWrappedPunk,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolConfiguratorProxy,
  getNFTOracle,
  getUNFTRegistryProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";

task("deploy-new-NFT")
  .addParam("name", `The NFT name`)
  .addParam("symbol", `The NFT symbol`)
  .setAction(async ({ name, symbol }, localBRE) => {
    await localBRE.run("set-DRE");
    await deployCustomERC721([name, symbol], true); //add nft to database with symbol as ID
  });
task("deploy-punks-NFT").setAction(async ({}, localBRE) => {
  await localBRE.run("set-DRE");
  const cryptoPunksMarket = await deployCryptoPunksMarket([], true);
  await deployWrappedPunk([cryptoPunksMarket.address], true);
});

task("unft-registerNFT", "Deploy unft tokens for dev enviroment")
  .addParam("nftaddress", `The address of the NFT to use`)
  .setAction(async ({ nftaddress }, localBRE) => {
    await localBRE.run("set-DRE");
    const unftRegistryProxy = await getUNFTRegistryProxy();
    await waitForTx(await unftRegistryProxy.createUNFT(nftaddress));
    const { uNftProxy } = await unftRegistryProxy.getUNFTAddresses(nftaddress);
    console.log("UNFT Token:", uNftProxy, "for nft address:", nftaddress);
  });

task("addAsset-NFTOracle", "Add an NFT Address to the Oracle")
  .addParam("nftaddress", `The address of the NFT to add`)
  .setAction(async ({ nftaddress }, localBRE) => {
    await localBRE.run("set-DRE");
    const nftOracle = await getNFTOracle();
    await waitForTx(await nftOracle.addCollection(nftaddress));
    console.log("NFTOracle: token address added: ", nftaddress);
  });

task("initNFTReserve", "Initializes the NFT Reserve")
  .addParam("nftaddress", `The address of the NFT to add`)
  .setAction(async ({ nftaddress }, localBRE) => {
    await localBRE.run("set-DRE");
    const configurator = await getLendPoolConfiguratorProxy();

    await waitForTx(
      await configurator.batchInitNft([{ underlyingAsset: nftaddress }])
    );
    console.log("ERC721 reserve initialized for: ", nftaddress);
  });

task("configNFTReserve", "Initializes the NFT Reserve")
  .addParam("nftaddress", `The address of the NFT to add`)
  .addParam("tokenid", `The tokenId of the NFT to add`)
  .addParam("maxsupply", `The address of the NFT to add`)
  .addParam("maxtokenid", `The address of the NFT to add`)
  .setAction(
    async ({ nftaddress, tokenid, maxsupply, maxtokenid }, localBRE) => {
      await localBRE.run("set-DRE");
      const configurator = await getLendPoolConfiguratorProxy();
      const nftsParams = {
        asset: nftaddress,
        tokenId: tokenid,
        maxSupply: maxsupply,
        maxTokenId: maxtokenid,
        baseLTV: "3000", // 30%
        liquidationThreshold: "9000", // 90%
        liquidationBonus: "500", // 5%
        redeemDuration: "2", // 2 day
        auctionDuration: "2", // 2 day
        redeemFine: "500", // 5%
        redeemThreshold: "5000", // 50%
        minBidFine: "2000", // 0.2 ETH
      };

      await waitForTx(await configurator.batchConfigNft([nftsParams]));
      console.log("ERC721 reserve configured for: ", nftaddress);
    }
  );

task("auth-wethgateway", "Authorize Weth Gateway to do transactions.")
  .addParam("nftaddress", "the address of the NFT to authorize")
  .setAction(async ({ nftaddress }) => {
    ////////////////////////////////////////////////////////////////////////////
    // Init & Config Reserve assets
    const wethGateway = await getWETHGateway();
    await waitForTx(await wethGateway.authorizeLendPoolNFT([nftaddress]));
    console.log("ERC721 address authorized for: ", nftaddress);
  });
