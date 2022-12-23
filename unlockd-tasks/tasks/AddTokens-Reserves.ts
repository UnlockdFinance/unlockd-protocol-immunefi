import { task } from "hardhat/config";
import {
  ConfigNames,
  getTreasuryAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import { deployRateStrategy } from "../../helpers/contracts-deployments";
import {
  getDebtToken,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getUToken,
} from "../../helpers/contracts-getters";

task("uToken-register", "Deploy uToken")
  .addParam("stratname", "Strategy name to retrieve configuration")
  .addParam("tokenaddress", "The address of the reserve to add")
  .addParam("tokendecimals", "The decimals numbers of the reserve")
  .addParam("utokenname", "The name for the UToken")
  .addParam("utokensymbol", "The symbol for the UToken")
  .addFlag("verify", "verifies the contract")
  .setAction(
    async (
      {
        stratname,
        tokenaddress,
        utokenname,
        utokensymbol,
        tokendecimals,
        verify,
      },
      localBRE
    ) => {
      // Config
      await localBRE.run("set-DRE");
      const config = loadPoolConfig(ConfigNames.Unlockd);
      const reservesParams = {
        ...config.ReservesConfig,
      };

      const addressProvider = getLendPoolAddressesProvider();
      const addressProviderAddress = (await addressProvider).address;
      const configurator = await getLendPoolConfiguratorProxy();
      const treasury = await getTreasuryAddress(config);

      const strategy = reservesParams[stratname].strategy;
      const rateStrategy: [string, string, string, string, string] = [
        addressProviderAddress,
        strategy.optimalUtilizationRate,
        strategy.baseVariableBorrowRate,
        strategy.variableRateSlope1,
        strategy.variableRateSlope2,
      ];

      // Get uToken implementation
      const uTokenImpl = await (await getUToken()).address;

      //Get DebtToken implementation
      const debtTokenImpl = await (await getDebtToken()).address;
      const rateStrat = await deployRateStrategy("", rateStrategy, verify);

      const uTokenName = `${config.UTokenNamePrefix} ${utokensymbol}`;
      const uTokenSymbol = `${config.UTokenSymbolPrefix} ${utokensymbol}`;
      const debtTokenName = `${config.DebtTokenNamePrefix} ${utokensymbol}`;
      const debtTokenSymbol = `${config.DebtTokenSymbolPrefix} ${utokensymbol}`;

      const initParam = {
        uTokenImpl: uTokenImpl,
        debtTokenImpl: debtTokenImpl,
        underlyingAssetDecimals: tokendecimals,
        interestRateAddress: rateStrat,
        underlyingAsset: tokenaddress,
        treasury: treasury,
        underlyingAssetName: utokenname,
        uTokenName: uTokenName,
        uTokenSymbol: uTokenSymbol,
        debtTokenName: debtTokenName,
        debtTokenSymbol: debtTokenSymbol,
      };

      const inputParams = {
        asset: tokenaddress,
        reserveFactor: reservesParams[stratname].reserveFactor,
      };

      await (await configurator).batchInitReserve([initParam]);
      await (await configurator).batchConfigReserve([inputParams]);
    }
  );
