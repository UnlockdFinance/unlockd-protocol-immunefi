import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployRateStrategy } from "../../helpers/contracts-deployments";
import { getOwnerWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

task(
  "tests:interestRate:variableRateSlope1",
  "User gets variableRateSlope1 rate"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.variableRateSlope1(wallet);
  await tx.wait();
  console.log(tx);
});

task(
  "tests:interestRate:variableRateSlope2",
  "User gets variableRateSlope2 rate"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.variableRateSlope2(wallet);
  await tx.wait();
  console.log(tx);
});

task(
  "tests:interestRate:baseVariableBorrowRate",
  "User gets baseVariableBorrowRate rate"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.INTERESTRATE.baseVariableBorrowRate(wallet);
  await tx.wait();
  console.log(tx);
});

task(
  "interestrate:updateinterestratestrategy",
  "Updates the interest rate strategy contract for a specific reserve"
)
  .addParam("reserve", "ERC20 Reserve address")
  .addParam("name", "ERC20 Reserve name")
  .addParam("addressesprovider", "The lend pool addresses provider")
  .setAction(async ({ reserve, name, addressesprovider }, DRE) => {
    await DRE.run("set-DRE");
    const wallet = await getOwnerWallet();
    const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
    const strategy = poolConfig.ReservesConfig[name].strategy;

    const rateStrategy: [string, string, string, string, string] = [
      addressesprovider,
      strategy.optimalUtilizationRate,
      strategy.baseVariableBorrowRate,
      strategy.variableRateSlope1,
      strategy.variableRateSlope2,
    ];
    const strategyAddr = await deployRateStrategy(
      strategy.name,
      rateStrategy,
      true
    );

    console.log("Interest Rate deployed with address " + strategyAddr);

    const tx =
      await Functions.LENDPOOLCONFIGURATOR.setReserveInterestRateAddress(
        wallet,
        [reserve],
        strategyAddr
      );
    // console.log(tx.toString());
  });
