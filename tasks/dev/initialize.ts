import { task } from "hardhat/config";
import {
  ConfigNames,
  getTreasuryAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import {
  deployUiPoolDataProvider,
  deployUnlockdProtocolDataProvider,
  deployWalletBalancerProvider,
} from "../../helpers/contracts-deployments";
import {
  getAllMockedNfts,
  getAllMockedTokens,
  getLendPoolAddressesProvider,
  getPunkGateway,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import {
  configureNftsByHelper,
  configureReservesByHelper,
  initNftsByHelper,
  initReservesByHelper,
} from "../../helpers/init-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import {
  getAllNftAddresses,
  getAllTokenAddresses,
} from "../../helpers/mock-helpers";
import { eContractid, eNetwork } from "../../helpers/types";

task("dev:initialize-lend-pool", "Initialize lend pool configuration.")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const {
      UTokenNamePrefix,
      UTokenSymbolPrefix,
      DebtTokenNamePrefix,
      DebtTokenSymbolPrefix,
      ReservesConfig,
      NftsConfig,
    } = poolConfig;
    const addressesProvider = await getLendPoolAddressesProvider();
    const admin = await addressesProvider.getPoolAdmin();
    const treasuryAddress = await getTreasuryAddress(poolConfig);
    if (
      treasuryAddress == undefined ||
      !notFalsyOrZeroAddress(treasuryAddress)
    ) {
      throw Error("Invalid treasury address in pool config");
    }

    const dataProvider = await deployUnlockdProtocolDataProvider(
      addressesProvider.address,
      verify
    );
    await insertContractAddressInDb(
      eContractid.UnlockdProtocolDataProvider,
      dataProvider.address
    );

    ////////////////////////////////////////////////////////////////////////////
    // Init & Config Reserve assets
    const mockTokens = await getAllMockedTokens();
    const allTokenAddresses = getAllTokenAddresses(mockTokens);

    await initReservesByHelper(
      ReservesConfig,
      allTokenAddresses,
      UTokenNamePrefix,
      UTokenSymbolPrefix,
      DebtTokenNamePrefix,
      DebtTokenSymbolPrefix,
      admin,
      treasuryAddress,
      pool,
      verify
    );
    await configureReservesByHelper(ReservesConfig, allTokenAddresses, admin);

    ////////////////////////////////////////////////////////////////////////////
    // Init & Config NFT assets
    const mockNfts = await getAllMockedNfts();
    const allNftAddresses = getAllNftAddresses(mockNfts);

    await initNftsByHelper(
      NftsConfig,
      allNftAddresses,
      admin,
      ConfigNames.Unlockd,
      verify
    );

    await configureNftsByHelper(NftsConfig, allNftAddresses, admin);

    //////////////////////////////////////////////////////////////////////////
    // Deploy some data provider for backend
    const reserveOracle = await addressesProvider.getReserveOracle();
    const nftOracle = await addressesProvider.getNFTOracle();

    const walletBalanceProvider = await deployWalletBalancerProvider(verify);
    console.log(
      "WalletBalancerProvider deployed at:",
      walletBalanceProvider.address
    );

    // this contract is not support upgrade, just deploy new contract
    const unlockdProtocolDataProvider = await deployUnlockdProtocolDataProvider(
      addressesProvider.address,
      verify
    );
    console.log(
      "UnlockdProtocolDataProvider deployed at:",
      unlockdProtocolDataProvider.address
    );

    const uiPoolDataProvider = await deployUiPoolDataProvider(
      reserveOracle,
      nftOracle,
      verify
    );
    console.log("UiPoolDataProvider deployed at:", uiPoolDataProvider.address);

    ////////////////////////////////////////////////////////////////////////////
    const lendPoolAddress = await addressesProvider.getLendPool();

    ////////////////////////////////////////////////////////////////////////////
    const wethGateway = await getWETHGateway();
    const nftAddresses: string[] = [];
    for (const [assetSymbol, assetAddress] of Object.entries(
      allNftAddresses
    ) as [string, string][]) {
      nftAddresses.push(assetAddress);
    }
    await waitForTx(await wethGateway.authorizeLendPoolNFT(nftAddresses));

    ////////////////////////////////////////////////////////////////////////////
    const punkGateway = await getPunkGateway();
    const reserveAddresses: string[] = [];
    for (const [assetSymbol, assetAddress] of Object.entries(
      allTokenAddresses
    ) as [string, string][]) {
      reserveAddresses.push(assetAddress);
    }
    await waitForTx(await punkGateway.authorizeLendPoolERC20(reserveAddresses));
  });
