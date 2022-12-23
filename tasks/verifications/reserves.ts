import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  getDebtToken,
  getInterestRate,
  getLendPool,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getUnlockdUpgradeableProxy,
  getUToken,
} from "../../helpers/contracts-getters";
import {
  getParamPerNetwork,
  verifyContract,
} from "../../helpers/contracts-helpers";
import {
  eContractid,
  eNetwork,
  ICommonConfiguration,
  IReserveParams,
} from "../../helpers/types";

task("verify:reserves", "Verify reserves contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ pool }, localDRE) => {
    await localDRE.run("set-DRE");
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { ReserveAssets, ReservesConfig } =
      poolConfig as ICommonConfiguration;

    const addressesProvider = await getLendPoolAddressesProvider();
    const lendPoolProxy = await getLendPool(
      await addressesProvider.getLendPool()
    );

    const lendPoolConfigurator = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );

    // Generic uToken implementation
    const uTokenImpl = await getUToken();
    console.log("\n- Verifying UToken implementation...\n");
    await verifyContract(eContractid.UToken, uTokenImpl, []);

    // Generic uToken implementation
    console.log("\n- Verifying DebtToken implementation...\n");
    const debtTokenImpl = await getDebtToken();
    await verifyContract(eContractid.DebtToken, debtTokenImpl, []);

    const configs = Object.entries(ReservesConfig) as [
      string,
      IReserveParams
    ][];
    for (const entry of Object.entries(
      getParamPerNetwork(ReserveAssets, network)
    )) {
      const [token, tokenAddress] = entry;
      console.log(`- Verifying ${token} token related contracts`);
      const tokenConfig = configs.find(([symbol]) => symbol === token);
      if (!tokenConfig) {
        throw `ReservesConfig not found for ${token} token`;
      }

      const { uTokenAddress, debtTokenAddress, interestRateAddress } =
        await lendPoolProxy.getReserveData(tokenAddress);

      const {
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      } = tokenConfig[1].strategy;

      const uTokenContract = await getUToken(uTokenAddress);

      // Proxy uToken
      console.log("\n- Verifying uToken proxy...\n");
      const uTokenInitEncodeData = uTokenImpl.interface.encodeFunctionData(
        "initialize",
        [
          addressesProvider.address,
          await uTokenContract.RESERVE_TREASURY_ADDRESS(),
          await uTokenContract.UNDERLYING_ASSET_ADDRESS(),
          await uTokenContract.decimals(),
          await uTokenContract.name(),
          await uTokenContract.symbol(),
        ]
      );
      await verifyContract(
        eContractid.UnlockdUpgradeableProxy,
        await getUnlockdUpgradeableProxy(uTokenAddress),
        [uTokenImpl.address, lendPoolConfigurator.address, uTokenInitEncodeData]
      );

      // Proxy debtToken
      const debtTokenInitEncodeData =
        debtTokenImpl.interface.encodeFunctionData("initialize", [
          addressesProvider.address,
          await uTokenContract.UNDERLYING_ASSET_ADDRESS(),
          await uTokenContract.decimals(),
          await uTokenContract.name(),
          await uTokenContract.symbol(),
        ]);
      console.log("\n- Verifying debtToken proxy...\n");
      await verifyContract(
        eContractid.UnlockdUpgradeableProxy,
        await getUnlockdUpgradeableProxy(debtTokenAddress),
        [
          debtTokenImpl.address,
          lendPoolConfigurator.address,
          debtTokenInitEncodeData,
        ]
      );

      // Interes Rate
      console.log(`\n- Verifying Interes rate...\n`);
      await verifyContract(
        eContractid.InterestRate,
        await getInterestRate(interestRateAddress),
        [
          addressesProvider.address,
          optimalUtilizationRate,
          baseVariableBorrowRate,
          variableRateSlope1,
          variableRateSlope2,
        ]
      );
    }
  });
