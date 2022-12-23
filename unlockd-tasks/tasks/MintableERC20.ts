import { task } from "hardhat/config";
import deployments from "../../deployments/deployed-contracts-goerli.json";
import { getOwnerWallet } from "../helpers/config";
import { daiContract, usdcContract } from "../helpers/constants";
import { Functions } from "../helpers/protocolFunctions";

task("tests:ERC20:getBalance", "User gets the balance of the reserve token")
  .addParam("reserveaddress", "the reserve address to get the balance from")
  .addParam("useraddress", "The User we want to check the balance from")
  .setAction(async ({ reserveaddress, useraddress }) => {
    const wallet = await getOwnerWallet();
    let contract;
    reserveaddress == deployments.USDC.address.toString()
      ? (contract = usdcContract)
      : (contract = daiContract);

    const tx = await Functions.RESERVES.getBalance(
      wallet,
      contract,
      useraddress
    ).then((v) => v.toString());
    reserveaddress == deployments.USDC.address.toString()
      ? console.log(tx.toString() / 10 ** 6)
      : console.log(tx.toString() / 10 ** 18);
  });
