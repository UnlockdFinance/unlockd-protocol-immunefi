import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

// Get the treasury address from the uToken
task(
  "dataProvider:getNftConfigurationDataByTokenId",
  "Gets individual NFT configuration data"
)
  .addParam("nftaddress", "The NFT address")
  .addParam("tokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.DATAPROVIDER.getNftConfigurationDataByTokenId(
      wallet,
      nftaddress,
      tokenid
    ).then((data) => data.toString());
    console.log(await tx);
  });

task("dataProvider:getLoanDataByCollateral", "Gets individual NFT loan data")
  .addParam("nftaddress", "The asset address")
  .addParam("tokenid", "The tokenId of the asset")
  .setAction(async ({ nftaddress, tokenid }) => {
    const wallet = await getUserWallet();
    const tx = await Functions.DATAPROVIDER.getLoanDataByCollateral(
      wallet,
      nftaddress,
      tokenid
    ).then((v) => v.toString());
    console.log(tx);
  });
