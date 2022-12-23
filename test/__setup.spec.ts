import { formatEther } from "@ethersproject/units";
import { MockContract } from "ethereum-waffle";
import { Signer } from "ethers";
import rawBRE from "hardhat";
import { FORK } from "../hardhat.config";
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  getLendPoolLiquidator,
  loadPoolConfig,
} from "../helpers/configuration";
import {
  ADDRESS_ID_PUNK_GATEWAY,
  ADDRESS_ID_WETH_GATEWAY,
} from "../helpers/constants";
import {
  deployAllMockNfts,
  deployAllMockTokens,
  deployGenericUNFTImpl,
  deployLendPool,
  deployLendPoolAddressesProvider,
  deployLendPoolAddressesProviderRegistry,
  deployLendPoolConfigurator,
  deployLendPoolLoan,
  deployMockChainlinkOracle,
  deployMockIncentivesController,
  deployMockNFTOracle,
  deployMockReserveOracle,
  deployNFTOracle,
  deployNFTXVaultFactory,
  deployPunkGateway,
  deployReserveOracle,
  deploySushiSwapRouter,
  deployUiPoolDataProvider,
  deployUNFTRegistry,
  deployUnlockdLibraries,
  deployUnlockdProtocolDataProvider,
  deployUnlockdProxyAdmin,
  deployUnlockdUpgradeableProxy,
  deployUTokenImplementations,
  deployWalletBalancerProvider,
  deployWETHGateway,
} from "../helpers/contracts-deployments";
import {
  getCryptoPunksMarket,
  getDeploySigner,
  getLendPool,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getPunkGateway,
  getSecondSigner,
  getUNFTRegistryProxy,
  getWETHGateway,
  getWrappedPunk,
} from "../helpers/contracts-getters";
import {
  getEthersSignerByAddress,
  getEthersSigners,
  insertContractAddressInDb,
} from "../helpers/contracts-helpers";
import {
  configureNftsByHelper,
  configureReservesByHelper,
  initNftsByHelper,
  initNFTXByHelper,
  initReservesByHelper,
} from "../helpers/init-helpers";
import { waitForTx } from "../helpers/misc-utils";
import {
  addAssetsInNFTOracle,
  deployAllChainlinkMockAggregators,
  deployChainlinkMockAggregator,
  setAggregatorsInReserveOracle,
  setPricesInNFTOracle,
} from "../helpers/oracles-helpers";
import {
  eContractid,
  eEthereumNetwork,
  tEthereumAddress,
} from "../helpers/types";
import UnlockdConfig from "../markets/unlockd";
import { CustomERC721, WETH9 } from "../types";
import { MintableERC20 } from "../types/MintableERC20";
import { MintableERC721 } from "../types/MintableERC721";
import { WETH9Mocked } from "../types/WETH9Mocked";
import { WrappedPunk } from "../types/WrappedPunk";
import { initializeMakeSuite } from "./helpers/make-suite";
import "./helpers/utils/math";

const MOCK_USD_PRICE = UnlockdConfig.ProtocolGlobalParams.MockUsdPrice;
const ALL_ASSETS_INITIAL_PRICES = UnlockdConfig.Mocks.AllAssetsInitialPrices;
const USD_ADDRESS = UnlockdConfig.ProtocolGlobalParams.UsdAddress;

const ALL_NFTS_INITIAL_PRICES = UnlockdConfig.Mocks.AllNftsInitialPrices;
const ALL_NFTS_MAX_SUPPLY = UnlockdConfig.Mocks.AllNftsMaxSupply;

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time("setup");
  const poolConfig = loadPoolConfig(ConfigNames.Unlockd);
  const network =
    FORK == "goerli" ? eEthereumNetwork.goerli : eEthereumNetwork.main; //goerli or main

  const deployerSigner = await getDeploySigner();
  const poolAdminSigner = await getEthersSignerByAddress(
    await getGenesisPoolAdmin(poolConfig)
  );
  const emergencyAdminSigner = await getEthersSignerByAddress(
    await getEmergencyAdmin(poolConfig)
  );
  const lendPoolLiquidatorSigner = await getEthersSignerByAddress(
    await getLendPoolLiquidator(poolConfig)
  );

  console.log(
    "Deployer:",
    await deployerSigner.getAddress(),
    "Balance:",
    formatEther(await deployerSigner.getBalance()),
    "ETH"
  );
  console.log(
    "PoolAdmin:",
    await poolAdminSigner.getAddress(),
    "Balance:",
    formatEther(await poolAdminSigner.getBalance()),
    "ETH"
  );
  console.log(
    "EmergencyAdmin:",
    await emergencyAdminSigner.getAddress(),
    "Balance:",
    formatEther(await emergencyAdminSigner.getBalance()),
    "ETH"
  );
  console.log(
    "LendPool Liquidator:",
    await lendPoolLiquidatorSigner.getAddress(),
    "Balance:",
    formatEther(await emergencyAdminSigner.getBalance()),
    "ETH"
  );

  const config = loadPoolConfig(ConfigNames.Unlockd);

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock external ERC20 Tokens, such as WETH, DAI...");
  const mockTokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked | WETH9;
  } = {
    ...(await deployAllMockTokens(true)),
  };

  console.log("-> Prepare mock external ERC721 NFTs, such as WPUNKS, BAYC...");
  const mockNfts: {
    [symbol: string]:
      | MockContract
      | MintableERC721
      | WrappedPunk
      | CustomERC721;
  } = {
    ...(await deployAllMockNfts(false, false)),
  };
  const cryptoPunksMarket = await getCryptoPunksMarket();
  await waitForTx(await cryptoPunksMarket.allInitialOwnersAssigned());
  const wrappedPunk = await getWrappedPunk();

  console.log("-> Prepare mock external IncentivesController...");
  const mockIncentivesController = await deployMockIncentivesController();
  const incentivesControllerAddress = mockIncentivesController.address;

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare proxy admin...");
  const unlockdProxyAdmin = await deployUnlockdProxyAdmin(
    eContractid.UnlockdProxyAdminTest
  );
  console.log("unlockdProxyAdmin:", unlockdProxyAdmin.address);

  //////////////////////////////////////////////////////////////////////////////
  // !!! MUST BEFORE LendPoolConfigurator which will getUNFTRegistry from address provider when init
  console.log("-> Prepare mock unft registry...");
  const unftGenericImpl = await deployGenericUNFTImpl(false);

  const unftRegistryImpl = await deployUNFTRegistry();
  const initEncodedData = unftRegistryImpl.interface.encodeFunctionData(
    "initialize",
    [
      unftGenericImpl.address,
      config.Mocks.UNftNamePrefix,
      config.Mocks.UNftSymbolPrefix,
    ]
  );

  const unftRegistryProxy = await deployUnlockdUpgradeableProxy(
    eContractid.UNFTRegistry,
    unlockdProxyAdmin.address,
    unftRegistryImpl.address,
    initEncodedData
  );

  const unftRegistry = await getUNFTRegistryProxy(unftRegistryProxy.address);

  await waitForTx(
    await unftRegistry.transferOwnership(await poolAdminSigner.getAddress())
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock unft tokens...");
  for (const [nftSymbol, mockedNft] of Object.entries(mockNfts) as [
    string,
    MintableERC721
  ][]) {
    await waitForTx(await unftRegistry.createUNFT(mockedNft.address));
    const uNftAddresses = await unftRegistry.getUNFTAddresses(
      mockedNft.address
    );
    console.log(
      "createUNFT:",
      nftSymbol,
      uNftAddresses.uNftProxy,
      uNftAddresses.uNftImpl
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare address provider...");
  const addressesProviderRegistry =
    await deployLendPoolAddressesProviderRegistry();

  const addressesProvider = await deployLendPoolAddressesProvider(
    UnlockdConfig.MarketId
  );
  await waitForTx(
    await addressesProvider.setPoolAdmin(await poolAdminSigner.getAddress())
  );
  await waitForTx(
    await addressesProvider.setEmergencyAdmin(
      await emergencyAdminSigner.getAddress()
    )
  );
  await waitForTx(
    await addressesProvider.setLendPoolLiquidator(
      await lendPoolLiquidatorSigner.getAddress()
    )
  );

  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(
      addressesProvider.address,
      UnlockdConfig.ProviderId
    )
  );

  //////////////////////////////////////////////////////////////////////////////
  // !!! MUST BEFORE LendPoolConfigurator which will getUNFTRegistry from address provider when init
  await waitForTx(
    await addressesProvider.setUNFTRegistry(unftRegistry.address)
  );
  await waitForTx(
    await addressesProvider.setIncentivesController(incentivesControllerAddress)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare unlockd libraries...");
  await deployUnlockdLibraries();

  console.log("-> Prepare lend pool...");
  const lendPoolImpl = await deployLendPool();
  await waitForTx(
    await addressesProvider.setLendPoolImpl(lendPoolImpl.address, [])
  );
  // configurator will create proxy for implement
  const lendPoolAddress = await addressesProvider.getLendPool();
  const lendPoolProxy = await getLendPool(lendPoolAddress);

  await insertContractAddressInDb(eContractid.LendPool, lendPoolProxy.address);

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare lend pool loan...");
  const lendPoolLoanImpl = await deployLendPoolLoan();
  await waitForTx(
    await addressesProvider.setLendPoolLoanImpl(lendPoolLoanImpl.address, [])
  );
  // configurator will create proxy for implement
  const lendPoolLoanProxy = await getLendPoolLoanProxy(
    await addressesProvider.getLendPoolLoan()
  );
  await insertContractAddressInDb(
    eContractid.LendPoolLoan,
    lendPoolLoanProxy.address
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare pool configurator...");
  const lendPoolConfiguratorImpl = await deployLendPoolConfigurator();
  await waitForTx(
    await addressesProvider.setLendPoolConfiguratorImpl(
      lendPoolConfiguratorImpl.address,
      []
    )
  );
  // configurator will create proxy for implement
  const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
    await addressesProvider.getLendPoolConfigurator()
  );
  await insertContractAddressInDb(
    eContractid.LendPoolConfigurator,
    lendPoolConfiguratorProxy.address
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock reserve token aggregators...");
  const allTokenDecimals = Object.entries(config.ReservesConfig).reduce(
    (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenConfig]) => ({
      ...accum,
      [tokenSymbol]: tokenConfig.reserveDecimals,
    }),
    {}
  );
  const mockAggregators = await deployAllChainlinkMockAggregators(
    allTokenDecimals,
    ALL_ASSETS_INITIAL_PRICES
  );
  const usdMockAggregator = await deployChainlinkMockAggregator(
    "USD",
    "8",
    MOCK_USD_PRICE
  );
  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, tokenContract]
    ) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {
      USD: USD_ADDRESS,
    }
  );
  const allAggregatorsAddresses = Object.entries(mockAggregators).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, aggregator]
    ) => ({
      ...accum,
      [tokenSymbol]: aggregator.address,
    }),
    {
      USD: usdMockAggregator.address,
    }
  );
  await deployMockChainlinkOracle("18", false); // Dummy aggregator for test

  console.log("-> Prepare reserve oracle...");
  const reserveOracleImpl = await deployReserveOracle([
    //mockTokens.WETH.address
  ]);
  await waitForTx(await reserveOracleImpl.initialize(mockTokens.WETH.address));
  await waitForTx(
    await addressesProvider.setReserveOracle(reserveOracleImpl.address)
  );
  await setAggregatorsInReserveOracle(
    allTokenAddresses,
    allAggregatorsAddresses,
    reserveOracleImpl
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock reserve oracle...");
  const mockReserveOracleImpl = await deployMockReserveOracle([]);
  await waitForTx(
    await mockReserveOracleImpl.initialize(mockTokens.WETH.address)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock NFT token aggregators...");
  const allNftAddresses = Object.entries(mockNfts).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, tokenContract]
    ) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );

  const allNftMaxSupply = Object.entries(ALL_NFTS_MAX_SUPPLY).reduce(
    (
      accum: { [tokenSymbol: string]: string },
      [tokenSymbol, tokenMaxSupply]
    ) => ({
      ...accum,
      [tokenSymbol]: tokenMaxSupply,
    }),
    {}
  );

  const allNftPrices = Object.entries(ALL_NFTS_INITIAL_PRICES).reduce(
    (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenPrice]) => ({
      ...accum,
      [tokenSymbol]: tokenPrice,
    }),
    {}
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare NFTX & Sushiswap Router...");

  const nftxVaultFactory = await deployNFTXVaultFactory();
  await waitForTx(
    await addressesProvider.setNFTXVaultFactory(nftxVaultFactory.address)
  );

  const sushiSwapRouter = await deploySushiSwapRouter();
  await waitForTx(
    await addressesProvider.setSushiSwapRouter(sushiSwapRouter.address)
  );

  const lendpoolConfigurator =
    await addressesProvider.getLendPoolConfigurator();
  await waitForTx(await lendPoolConfiguratorProxy.setTimeframe(3600000));

  console.log("-> Prepare nft oracle...");
  const nftOracleImpl = await deployNFTOracle();
  await waitForTx(
    await nftOracleImpl.initialize(
      await addressesProvider.getPoolAdmin(),
      lendpoolConfigurator
    )
  );
  await waitForTx(await addressesProvider.setNFTOracle(nftOracleImpl.address));
  await addAssetsInNFTOracle(allNftAddresses, nftOracleImpl);
  await setPricesInNFTOracle(
    allNftPrices,
    allNftAddresses,
    allNftMaxSupply,
    nftOracleImpl
  );

  await nftOracleImpl.setPriceManagerStatus(lendpoolConfigurator, true);

  console.log("-> Prepare mock nft oracle...");
  const mockNftOracleImpl = await deployMockNFTOracle();
  await waitForTx(
    await mockNftOracleImpl.initialize(
      await addressesProvider.getPoolAdmin(),
      lendpoolConfigurator
    )
  );

  //////////////////////////////////////////////////////////////////////////////

  console.log("-> Prepare Reserve pool...");
  const { ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };

  // Reserve params from pool + mocked tokens
  const reservesParams = {
    ...config.ReservesConfig,
  };

  console.log("-> Prepare UToken impl contract...");
  await deployUTokenImplementations(ConfigNames.Unlockd, reservesParams, false);

  console.log("-> Prepare Reserve init and configure...");
  const {
    UTokenNamePrefix,
    UTokenSymbolPrefix,
    DebtTokenNamePrefix,
    DebtTokenSymbolPrefix,
  } = config;

  //const treasuryAddress = await getTreasuryAddress(config);
  const [_deployer, ...restSigners] = await getEthersSigners();
  const treasuryAddress = await restSigners[0].getAddress(); //TREASURY WILL BE users [0] FOR TESTING PURPOSES

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    UTokenNamePrefix,
    UTokenSymbolPrefix,
    DebtTokenNamePrefix,
    DebtTokenSymbolPrefix,
    await poolAdminSigner.getAddress(),
    treasuryAddress,
    ConfigNames.Unlockd,
    false
  );

  await configureReservesByHelper(
    reservesParams,
    allReservesAddresses,
    await poolAdminSigner.getAddress()
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare NFT pools...");
  const allNftsAddresses = {
    ...allNftAddresses,
  };

  // NFT params from pool + mocked tokens
  const nftsParams = {
    ...config.NftsConfig,
  };

  console.log("-> Prepare NFT init and configure...");
  await initNftsByHelper(
    nftsParams,
    allNftsAddresses,
    await poolAdminSigner.getAddress(),
    ConfigNames.Unlockd,
    false
  );

  await configureNftsByHelper(
    nftsParams,
    allNftsAddresses,
    await poolAdminSigner.getAddress()
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare wallet & data & ui provider...");
  const walletProvider = await deployWalletBalancerProvider();
  await waitForTx(
    await addressesProvider.setWalletBalanceProvider(walletProvider.address)
  );

  const unlockdDataProvider = await deployUnlockdProtocolDataProvider(
    addressesProvider.address
  );
  await waitForTx(
    await addressesProvider.setUnlockdDataProvider(unlockdDataProvider.address)
  );

  const uiDataProvider = await deployUiPoolDataProvider(
    reserveOracleImpl.address,
    nftOracleImpl.address,
    false
  );
  await waitForTx(
    await addressesProvider.setUIDataProvider(uiDataProvider.address)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare WETH gateway...");
  const wethGatewayImpl = await deployWETHGateway();
  const wethGwInitEncodedData = wethGatewayImpl.interface.encodeFunctionData(
    "initialize",
    [addressesProvider.address, mockTokens.WETH.address]
  );
  const wethGatewayProxy = await deployUnlockdUpgradeableProxy(
    eContractid.WETHGateway,
    unlockdProxyAdmin.address,
    wethGatewayImpl.address,
    wethGwInitEncodedData
  );
  await waitForTx(
    await addressesProvider.setAddress(
      ADDRESS_ID_WETH_GATEWAY,
      wethGatewayProxy.address
    )
  );
  const wethGateway = await getWETHGateway(
    await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY)
  );
  await waitForTx(
    await wethGateway.authorizeLendPoolNFT([
      allNftsAddresses.BAYC,
      allNftsAddresses.WPUNKS,
    ])
  );
  await insertContractAddressInDb(eContractid.WETHGateway, wethGateway.address);

  console.log("-> Prepare PUNK gateway...");
  const punkGatewayImpl = await deployPunkGateway();
  const punkGwInitEncodedData = punkGatewayImpl.interface.encodeFunctionData(
    "initialize",
    [
      addressesProvider.address,
      wethGateway.address,
      cryptoPunksMarket.address,
      wrappedPunk.address,
    ]
  );
  const punkGatewayProxy = await deployUnlockdUpgradeableProxy(
    eContractid.PunkGateway,
    unlockdProxyAdmin.address,
    punkGatewayImpl.address,
    punkGwInitEncodedData
  );
  await waitForTx(
    await addressesProvider.setAddress(
      ADDRESS_ID_PUNK_GATEWAY,
      punkGatewayProxy.address
    )
  );
  const punkGateway = await getPunkGateway(
    await addressesProvider.getAddress(ADDRESS_ID_PUNK_GATEWAY)
  );
  await waitForTx(
    await punkGateway.authorizeLendPoolERC20([
      allReservesAddresses.WETH,
      allReservesAddresses.DAI,
      allReservesAddresses.USDC,
    ])
  );
  await insertContractAddressInDb(eContractid.PunkGateway, punkGateway.address);

  await waitForTx(
    await wethGateway.authorizeCallerWhitelist([punkGateway.address], true)
  );

  await initNFTXByHelper();

  console.timeEnd("setup");
};

before(async () => {
  await rawBRE.run("set-DRE");
  const deployer = await getDeploySigner();
  const secondaryWallet = await getSecondSigner();
  const FORK = process.env.FORK;

  if (FORK) {
    await rawBRE.run("unlockd:fork", { skipRegistry: false });
  } else {
    console.log("-> Deploying test environment...");
    await buildTestEnv(deployer, secondaryWallet);
  }

  console.log("-> Initialize make suite...");
  await initializeMakeSuite();

  console.log("\n***************");
  console.log("Setup and snapshot finished");
  console.log("***************\n");
});
