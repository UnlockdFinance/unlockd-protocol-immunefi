import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  getBorrowLogic,
  getGenericLogic,
  getLendPoolAddressesProvider,
  getLendPoolAddressesProviderRegistry,
  getLendPoolConfiguratorImpl,
  getLendPoolImpl,
  getLendPoolLoanImpl,
  getLiquidateLogic,
  getNFTOracleImpl,
  getPunkGateway,
  getPunkGatewayImpl,
  getReserveLogic,
  getReserveOracleImpl,
  getSupplyLogic,
  getUIPoolDataProvider,
  getUnlockdProtocolDataProvider,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
  getWalletProvider,
  getWETHGateway,
  getWETHGatewayImpl,
} from "../../helpers/contracts-getters";
import {
  getContractAddressInDb,
  getParamPerNetwork,
  verifyContract,
} from "../../helpers/contracts-helpers";
import { verifyEtherscanContract } from "../../helpers/etherscan-verification";
import {
  eContractid,
  eNetwork,
  ICommonConfiguration,
} from "../../helpers/types";

task("verify:general", "Verify general contracts at Etherscan")
  .addFlag("all", "Verify all contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ all, pool }, localDRE) => {
    await localDRE.run("set-DRE");
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { MarketId, CryptoPunksMarket, WrappedPunkToken } =
      poolConfig as ICommonConfiguration;

    // const unlockdCollectorImpl = await getUnlockdCollectorImpl();
    const providerRegistry = await getLendPoolAddressesProviderRegistry();
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPoolAddress = await addressesProvider.getLendPool();
    const lendPoolConfiguratorAddress =
      await addressesProvider.getLendPoolConfigurator();
    const lendPoolLoanAddress = await addressesProvider.getLendPoolLoan();

    const lendPoolProxy = await getUnlockdUpgradeableProxy(lendPoolAddress);
    const lendPoolConfiguratorProxy = await getUnlockdUpgradeableProxy(
      lendPoolConfiguratorAddress
    );
    const lendPoolLoanProxy = await getUnlockdUpgradeableProxy(
      lendPoolLoanAddress
    );

    const punkAddress = getParamPerNetwork(CryptoPunksMarket, network);
    const wpunkAddress = getParamPerNetwork(WrappedPunkToken, network);

    const wethGateway = await getWETHGateway();
    const punkGateway = await getPunkGateway();

    const lendPoolImpl = await getLendPoolImpl();
    const lendPoolConfiguratorImpl = await getLendPoolConfiguratorImpl();
    const lendPoolLoanImpl = await getLendPoolLoanImpl();

    const reserveOracleImpl = await getReserveOracleImpl();
    const nftOracleImpl = await getNFTOracleImpl();

    const wethGatewayImpl = await getWETHGatewayImpl();
    const punkGatewayImpl = await getPunkGatewayImpl();

    const proxyAdminFund = await getUnlockdProxyAdminById(
      eContractid.UnlockdProxyAdminFund
    );
    await verifyContract(eContractid.UnlockdProxyAdminFund, proxyAdminFund, []);

    const proxyAdminPool = await getUnlockdProxyAdminById(
      eContractid.UnlockdProxyAdminPool
    );
    await verifyContract(eContractid.UnlockdProxyAdminPool, proxyAdminPool, []);

    if (all) {
      const dataProvider = await getUnlockdProtocolDataProvider();
      const walletProvider = await getWalletProvider();
      const uiProvider = await getUIPoolDataProvider();

      // UnlockdCollector
      // console.log("\n- Verifying Collector...\n");
      // await verifyContract(eContractid.UnlockdCollectorImpl, unlockdCollectorImpl, []);

      // Address Provider
      console.log("\n- Verifying provider registry...\n");
      await verifyContract(
        eContractid.LendPoolAddressesProviderRegistry,
        providerRegistry,
        []
      );

      console.log("\n- Verifying address provider...\n");
      await verifyContract(
        eContractid.LendPoolAddressesProvider,
        addressesProvider,
        [MarketId]
      );

      // Lend Pool implementation
      console.log("\n- Verifying LendPool Implementation...\n");
      await verifyContract(eContractid.LendPoolImpl, lendPoolImpl, []);

      // Lend Pool Configurator implementation
      console.log("\n- Verifying LendPool Configurator Implementation...\n");
      await verifyContract(
        eContractid.LendPoolConfiguratorImpl,
        lendPoolConfiguratorImpl,
        []
      );

      // Lend Pool Loan Manager implementation
      console.log("\n- Verifying LendPool Loan Implementation...\n");
      await verifyContract(eContractid.LendPoolLoanImpl, lendPoolLoanImpl, []);

      // Unlockd Data Provider
      console.log("\n- Verifying Unlockd Data Provider...\n");
      await verifyContract(
        eContractid.UnlockdProtocolDataProvider,
        dataProvider,
        [addressesProvider.address]
      );

      // Wallet balance provider
      console.log("\n- Verifying Wallet Balance Provider...\n");
      await verifyContract(
        eContractid.WalletBalanceProvider,
        walletProvider,
        []
      );

      // UI data provider
      console.log("\n- Verifying UI Data Provider...\n");
      await verifyContract(eContractid.UIPoolDataProvider, uiProvider, [
        await addressesProvider.getReserveOracle(),
        await addressesProvider.getNFTOracle(),
      ]);

      console.log("\n- Verifying ReserveOracle...\n");
      await verifyContract(
        eContractid.ReserveOracleImpl,
        reserveOracleImpl,
        []
      );

      console.log("\n- Verifying NFTOracle...\n");
      await verifyContract(eContractid.NFTOracleImpl, nftOracleImpl, []);

      // WETHGateway
      console.log("\n- Verifying WETHGateway...\n");
      await verifyContract(eContractid.WETHGatewayImpl, wethGatewayImpl, []);

      // PunkGateway
      console.log("\n- Verifying PunkGateway...\n");
      await verifyContract(eContractid.PunkGatewayImpl, punkGatewayImpl, []);
    }

    // UnlockdCollector Proxy
    /*  console.log("\n- Verifying Collector...\n");
    const unlockdCollectorProxy = await getUnlockdCollectorProxy();
    const collectorProxyAdmin = await getUnlockdProxyAdminById(eContractid.UnlockdProxyAdminFund);
    await verifyContract(eContractid.UnlockdCollector, unlockdCollectorProxy, [
      unlockdCollectorImpl.address,
      collectorProxyAdmin.address,
      unlockdCollectorImpl.interface.encodeFunctionData("initialize"),
    ]); */

    // // Lend Pool proxy
    // console.log("\n- Verifying Lend Pool Proxy...\n");
    // await verifyContract(eContractid.UnlockdUpgradeableProxy, lendPoolProxy, [
    //   lendPoolImpl.address,
    //   addressesProvider.address,
    //   lendPoolImpl.interface.encodeFunctionData("initialize", [addressesProvider.address]),
    // ]);

    // // LendPool Conf proxy
    // console.log("\n- Verifying Lend Pool Configurator Proxy...\n");
    // await verifyContract(eContractid.UnlockdUpgradeableProxy, lendPoolConfiguratorProxy, [
    //   lendPoolConfiguratorImpl.address,
    //   addressesProvider.address,
    //   lendPoolConfiguratorImpl.interface.encodeFunctionData("initialize", [addressesProvider.address]),
    // ]);

    // // LendPool loan manager
    // console.log("\n- Verifying Lend Pool Loan Manager Proxy...\n");
    // await verifyContract(eContractid.UnlockdUpgradeableProxy, lendPoolLoanProxy, [
    //   lendPoolLoanImpl.address,
    //   addressesProvider.address,
    //   lendPoolLoanImpl.interface.encodeFunctionData("initialize", [addressesProvider.address]),
    // ]);

    // // WETHGateway
    // console.log("\n- Verifying WETHGateway Proxy...\n");
    // await verifyContract(eContractid.UnlockdUpgradeableProxy, wethGateway, [
    //   wethGatewayImpl.address,
    //   proxyAdminPool.address,
    //   wethGatewayImpl.interface.encodeFunctionData("initialize", [
    //     addressesProvider.address,
    //     await getWrappedNativeTokenAddress(poolConfig),
    //   ]),
    // ]);

    // // PunkGateway
    // console.log("\n- Verifying PunkGateway Proxy...\n");
    // await verifyContract(eContractid.UnlockdUpgradeableProxy, punkGateway, [
    //   punkGatewayImpl.address,
    //   proxyAdminPool.address,
    //   punkGatewayImpl.interface.encodeFunctionData("initialize", [
    //     addressesProvider.address,
    //     wethGateway.address,
    //     punkAddress,
    //     wpunkAddress,
    //   ]),
    // ]);

    console.log("Finished verifications.");
  });

task("verify:libraries", "Verify libraries at Etherscan")
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

    const nftLogicAddress = await getContractAddressInDb(eContractid.NftLogic);
    const validationLogicAddress = await getContractAddressInDb(
      eContractid.ValidationLogic
    );

    console.log("\n- Verifying NftLogic...\n");
    await verifyEtherscanContract(nftLogicAddress, []);

    console.log("\n- Verifying ValidationLogic...\n");
    await verifyEtherscanContract(validationLogicAddress, []);

    console.log("\n- Verifying GenericLogic...\n");
    const genLogic = await getGenericLogic();
    await verifyContract(eContractid.GenericLogic, genLogic, []);

    console.log("\n- Verifying ReserveLogic...\n");
    const resLogic = await getReserveLogic();
    await verifyContract(eContractid.ReserveLogic, resLogic, []);

    console.log("\n- Verifying SupplyLogic...\n");
    const supLogic = await getSupplyLogic();
    await verifyContract(eContractid.SupplyLogic, supLogic, []);

    console.log("\n- Verifying BorrowLogic...\n");
    const borLogic = await getBorrowLogic();
    await verifyContract(eContractid.BorrowLogic, borLogic, []);

    console.log("\n- Verifying LiquidateLogic...\n");
    const liqLogic = await getLiquidateLogic();
    await verifyContract(eContractid.LiquidateLogic, liqLogic, []);

    console.log("Finished verifications.");
  });
