import { task } from "hardhat/config";
import { getUserWallet } from "../helpers/config";
import { Contracts, MockContracts } from "../helpers/constants";
import { Functions } from "../helpers/protocolFunctions";

task("wethgateway:depositETH", "Deposits raw ETH into Unlockd")
  .addParam("amount", "The amount in WEI")
  .addParam("to", "The on behalf of")

  .setAction(async ({ amount, to }) => {
    const wallet = await getUserWallet();
    //amount must be in WEI!!
    const utokenContract = MockContracts["uWETH"];
    await Functions.RESERVES.approve(
      wallet,
      utokenContract,
      Contracts.wethGateway.address,
      "99999999999999999999999999999999999999"
    );
    console.log("approved utoken");
    await Functions.WETH_GATEWAY.depositETH(wallet, amount, to);
  });

task("wethgateway:withdrawETH", "Withdraws raw ETH from Unlockd")
  .addParam("amount", "The amount in WEI")
  .addParam("to", "The on behalf of")
  .setAction(async ({ amount, to }) => {
    const wallet = await getUserWallet();
    const tokenContract = MockContracts["uWETH"];

    console.log(wallet.address);
    //amount must be in WEI!!
    await Functions.WETH_GATEWAY.withdrawETH(wallet, amount, to);
  });
