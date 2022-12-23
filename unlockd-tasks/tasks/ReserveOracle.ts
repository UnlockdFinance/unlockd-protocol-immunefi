import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

//Get Asset price
task(
  "reserveoracle:getassetprice",
  "Returns the reserve price for a given asset"
)
  .addParam("asset", "The asset address")
  .setAction(async ({ asset }) => {
    const wallet = await getUserWallet();
    const price = await Functions.RESERVEORACLE.getAssetPrice(wallet, asset);
    console.log(price.toString());
  });
