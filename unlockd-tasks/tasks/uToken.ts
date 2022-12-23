import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

// Get the treasury address from the uToken
task(
  "utoken:getreasuryaddress",
  "Gets the reserve treasury address set in a uToken"
).setAction(async () => {
  const wallet = await getUserWallet();
  const tx = await Functions.UTOKEN.RESERVE_TREASURY_ADDRESS(wallet);
  console.log(JSON.stringify(tx));
});
