import { BigNumber } from "@ethersproject/bignumber";

export interface SymbolMap<T> {
  [symbol: string]: T;
}

export type eNetwork = eEthereumNetwork;

export enum eEthereumNetwork {
  hardhat = "hardhat",
  localhost = "localhost",
  goerli = "goerli",
  main = "main",
}

export enum UnlockdPools {
  proto = "proto",
}

export enum eContractid {
  MintableERC20 = "MintableERC20",
  MintableERC721 = "MintableERC721",
  CustomERC721 = "CustomERC721",
  LendPoolAddressesProvider = "LendPoolAddressesProvider",
  LendPoolAddressesProviderRegistry = "LendPoolAddressesProviderRegistry",
  LendPoolParametersProvider = "LendPoolParametersProvider",
  LendPoolConfigurator = "LendPoolConfigurator",
  ValidationLogic = "ValidationLogic",
  ReserveLogic = "ReserveLogic",
  NftLogic = "NftLogic",
  GenericLogic = "GenericLogic",
  SupplyLogic = "SupplyLogic",
  BorrowLogic = "BorrowLogic",
  LiquidateLogic = "LiquidateLogic",
  LiquidateMarketsLogic = "LiquidateMarketsLogic",
  ConfiguratorLogic = "ConfiguratorLogic",
  LendPool = "LendPool",
  LendPoolLoan = "LendPoolLoan",
  ReserveOracle = "ReserveOracle",
  ReserveOracleImpl = "ReserveOracleImpl",
  NFTOracle = "NFTOracle",
  NFTOracleImpl = "NFTOracleImpl",
  Proxy = "Proxy",
  MockChainlinkOracle = "MockChainlinkOracle",
  MockNFTOracle = "MockNFTOracle",
  MockReserveOracle = "MockReserveOracle",
  InterestRate = "InterestRate",
  UnlockdUpgradeableProxy = "UnlockdUpgradeableProxy",
  UnlockdProxyAdminTest = "UnlockdProxyAdminTest",
  UnlockdProxyAdminPool = "UnlockdProxyAdminPool", //LendPool Contracts, etc Oracle(Reserve, NFT)
  UnlockdProxyAdminFund = "UnlockdProxyAdminFund", //Treasury Fundings, etc Collector
  WalletBalanceProvider = "WalletBalanceProvider",
  UToken = "UToken",
  DebtToken = "DebtToken",
  UNFT = "UNFT",
  MockUNFT = "MockUNFT",
  UnlockdProtocolDataProvider = "UnlockdProtocolDataProvider",
  IERC20Detailed = "IERC20Detailed",
  IERC721Detailed = "IERC721Detailed",
  FeeProvider = "FeeProvider",
  WETHGateway = "WETHGateway",
  WETHGatewayImpl = "WETHGatewayImpl",
  WETH = "WETH",
  WETHMocked = "WETHMocked",
  WPUNKSGateway = "WPUNKSGateway",
  WPUNKS = "WPUNKS",
  WPUNKSMocked = "WPUNKSMocked",
  SelfdestructTransferMock = "SelfdestructTransferMock",
  LendPoolImpl = "LendPoolImpl",
  LendPoolConfiguratorImpl = "LendPoolConfiguratorImpl",
  LendPoolLoanImpl = "LendPoolLoanImpl",
  UNFTRegistry = "UNFTRegistry",
  UNFTRegistryImpl = "UNFTRegistryImpl",
  CryptoPunksMarket = "CryptoPunksMarket",
  WrappedPunk = "WrappedPunk",
  PunkGateway = "PunkGateway",
  PunkGatewayImpl = "PunkGatewayImpl",
  MockIncentivesController = "MockIncentivesController",
  UIPoolDataProvider = "UIPoolDataProvider",
  UnlockdCollector = "UnlockdCollector",
  UnlockdCollectorImpl = "UnlockdCollectorImpl",
  TimelockControllerFast = "TimelockControllerFast",
  TimelockControllerSlow = "TimelockControllerSlow",
  RepayAndTransferHelper = "RepayAndTransferHelper",
  NFTXVaultFactory = "NFTXVaultFactory",
  UniswapV2Factory = "UniswapV2Factory",
  SushiSwapRouter = "SushiSwapRouter",
  NFTXHelper = "NFTXHelper",
  LSSVMPPair = "LSSVMPair",
}

export enum ProtocolLoanState {
  // We need a default that is not 'Created' - this is the zero value
  None,
  // The loan data is stored, but not initiated yet.
  Created,
  // The loan has been initialized, funds have been delivered to the borrower and the collateral is held.
  Active,
  // The loan has been auctioned, debt have been repaid to the pool and the collateral is held.
  Auction,
  // The loan has been repaid, and the collateral has been returned to the borrower. This is a terminal state.
  Repaid,
  // The loan was delinquent and collateral claimed by the liquidator. This is a terminal state.
  Defaulted,
}

export enum ProtocolErrors {
  //common errors
  CALLER_NOT_POOL_ADMIN = "100", // 'The caller must be the pool admin'
  CALLER_NOT_ADDRESS_PROVIDER = "101",
  INVALID_FROM_BALANCE_AFTER_TRANSFER = "102",
  INVALID_TO_BALANCE_AFTER_TRANSFER = "103",
  CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST = "104",
  CALLER_NOT_POOL_LIQUIDATOR = "105",
  INVALID_ZERO_ADDRESS = "106",
  CALLER_NOT_LTV_MANAGER = "107",
  CALLER_NOT_PRICE_MANAGER = "108",

  //math library erros
  MATH_MULTIPLICATION_OVERFLOW = "200",
  MATH_ADDITION_OVERFLOW = "201",
  MATH_DIVISION_BY_ZERO = "202",

  //validation & check errors
  VL_INVALID_AMOUNT = "301", // 'Amount must be greater than 0'
  VL_NO_ACTIVE_RESERVE = "302", // 'Action requires an active reserve'
  VL_RESERVE_FROZEN = "303", // 'Action cannot be performed because the reserve is frozen'
  VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE = "304", // 'User cannot withdraw more than the available balance'
  VL_BORROWING_NOT_ENABLED = "305", // 'Borrowing is not enabled'
  VL_COLLATERAL_BALANCE_IS_0 = "306", // 'The collateral balance is 0'
  VL_HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD = "307", // 'Health factor is lesser than the liquidation threshold'
  VL_COLLATERAL_CANNOT_COVER_NEW_BORROW = "308", // 'There is not enough collateral to cover a new borrow'
  VL_NO_DEBT_OF_SELECTED_TYPE = "309", // 'for repayment of stable debt, the user needs to have stable debt, otherwise, he needs to have variable debt'
  VL_NO_ACTIVE_NFT = "310",
  VL_NFT_FROZEN = "311",
  VL_SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER = "312", // 'User did not borrow the specified currency'
  VL_INVALID_HEALTH_FACTOR = "313",
  VL_INVALID_ONBEHALFOF_ADDRESS = "314",
  VL_INVALID_TARGET_ADDRESS = "315",
  VL_INVALID_RESERVE_ADDRESS = "316",
  VL_SPECIFIED_LOAN_NOT_BORROWED_BY_USER = "317",
  VL_SPECIFIED_RESERVE_NOT_BORROWED_BY_USER = "318",
  VL_HEALTH_FACTOR_HIGHER_THAN_LIQUIDATION_THRESHOLD = "319",
  VL_TIMEFRAME_EXCEEDED = "320",

  //lend pool errors
  LP_CALLER_NOT_LEND_POOL_CONFIGURATOR = "400", // 'The caller of the function is not the lending pool configurator'
  LP_IS_PAUSED = "401", // 'Pool is paused'
  LP_NO_MORE_RESERVES_ALLOWED = "402",
  LP_NOT_CONTRACT = "403",
  LP_BORROW_NOT_EXCEED_LIQUIDATION_THRESHOLD = "404",
  LP_BORROW_IS_EXCEED_LIQUIDATION_PRICE = "405",
  LP_NO_MORE_NFTS_ALLOWED = "406",
  LP_INVALIED_USER_NFT_AMOUNT = "407",
  LP_INCONSISTENT_PARAMS = "408",
  LP_NFT_IS_NOT_USED_AS_COLLATERAL = "409",
  LP_CALLER_MUST_BE_AN_UTOKEN = "410",
  LP_INVALID_NFT_AMOUNT = "411",
  LP_NFT_HAS_USED_AS_COLLATERAL = "412",
  LP_DELEGATE_CALL_FAILED = "413",
  LP_AMOUNT_LESS_THAN_EXTRA_DEBT = "414",
  LP_AMOUNT_LESS_THAN_REDEEM_THRESHOLD = "415",
  LP_AMOUNT_GREATER_THAN_MAX_REPAY = "416",
  LP_NFT_TOKEN_ID_EXCEED_MAX_LIMIT = "417",
  LP_NFT_SUPPLY_NUM_EXCEED_MAX_LIMIT = "418",
  LP_CALLER_NOT_LEND_POOL_LIQUIDATOR_NOR_GATEWAY = "419",
  LP_CONSECUTIVE_BIDS_NOT_ALLOWED = "420",
  LP_INVALID_OVERFLOW_VALUE = "421",
  LP_CALLER_NOT_NFT_HOLDER = "422",
  LP_NFT_NOT_ALLOWED_TO_SELL = "423",
  LP_RESERVES_WITHOUT_ENOUGH_LIQUIDITY = "424",
  LP_COLLECTION_NOT_SUPPORTED = "425",

  //lend pool loan errors
  LPL_INVALID_LOAN_STATE = "480",
  LPL_INVALID_LOAN_AMOUNT = "481",
  LPL_INVALID_TAKEN_AMOUNT = "482",
  LPL_AMOUNT_OVERFLOW = "483",
  LPL_BID_PRICE_LESS_THAN_LIQUIDATION_PRICE = "484",
  LPL_BID_PRICE_LESS_THAN_HIGHEST_PRICE = "485",
  LPL_BID_REDEEM_DURATION_HAS_END = "486",
  LPL_BID_USER_NOT_SAME = "487",
  LPL_BID_REPAY_AMOUNT_NOT_ENOUGH = "488",
  LPL_BID_AUCTION_DURATION_HAS_END = "489",
  LPL_BID_AUCTION_DURATION_NOT_END = "490",
  LPL_BID_PRICE_LESS_THAN_BORROW = "491",
  LPL_INVALID_BIDDER_ADDRESS = "492",
  LPL_AMOUNT_LESS_THAN_BID_FINE = "493",
  LPL_BID_INVALID_BID_FINE = "494",
  LPL_BID_PRICE_LESS_THAN_MIN_BID_REQUIRED = "495",
  //common token errors
  CT_CALLER_MUST_BE_LEND_POOL = "500", // 'The caller of this function must be a lending pool'
  CT_INVALID_MINT_AMOUNT = "501", //invalid amount to mint
  CT_INVALID_BURN_AMOUNT = "502", //invalid amount to burn
  CT_BORROW_ALLOWANCE_NOT_ENOUGH = "503",

  //reserve logic errors
  RL_RESERVE_ALREADY_INITIALIZED = "601", // 'Reserve has already been initialized'
  RL_LIQUIDITY_INDEX_OVERFLOW = "602", //  Liquidity index overflows uint128
  RL_VARIABLE_BORROW_INDEX_OVERFLOW = "603", //  Variable borrow index overflows uint128
  RL_LIQUIDITY_RATE_OVERFLOW = "604", //  Liquidity rate overflows uint128
  RL_VARIABLE_BORROW_RATE_OVERFLOW = "605", //  Variable borrow rate overflows uint128

  //configure errors
  LPC_RESERVE_LIQUIDITY_NOT_0 = "700", // 'The liquidity of the reserve needs to be 0'
  LPC_INVALID_CONFIGURATION = "701", // 'Invalid risk parameters for the reserve'
  LPC_CALLER_NOT_EMERGENCY_ADMIN = "702", // 'The caller must be the emergency admin'
  LPC_INVALID_UNFT_ADDRESS = "703",
  LPC_INVALIED_LOAN_ADDRESS = "704",
  LPC_NFT_LIQUIDITY_NOT_0 = "705",
  LPC_PARAMS_MISMATCH = "706",
  LPC_FEE_PERCENTAGE_TOO_HIGH = "707",
  LPC_INCONSISTENT_PARAMS = "708",
  //reserve config errors
  RC_INVALID_LTV = "730",
  RC_INVALID_LIQ_THRESHOLD = "731",
  RC_INVALID_LIQ_BONUS = "732",
  RC_INVALID_DECIMALS = "733",
  RC_INVALID_RESERVE_FACTOR = "734",
  RC_INVALID_REDEEM_DURATION = "735",
  RC_INVALID_AUCTION_DURATION = "736",
  RC_INVALID_REDEEM_FINE = "737",

  //address provider erros
  LPAPR_PROVIDER_NOT_REGISTERED = "760", // 'Provider is not registered'
  LPAPR_INVALID_ADDRESSES_PROVIDER_ID = "761",

  // Misc errors
  INVALID_OWNER_REVERT_MSG = "Ownable: caller is not the owner",
  TRANSFER_AMOUNT_EXCEEDS_BALANCE = "ERC20: transfer amount exceeds balance",
  SAFEERC20_LOWLEVEL_CALL = "SafeERC20: low-level call failed",
}

export type tEthereumAddress = string;
export type tStringTokenBigUnits = string; // 1 ETH, or 10e6 USDC or 10e18 DAI
export type tBigNumberTokenBigUnits = BigNumber;
export type tStringTokenSmallUnits = string; // 1 wei, or 1 basic unit of USDC, or 1 basic unit of DAI
export type tBigNumberTokenSmallUnits = BigNumber;

export interface iAssetCommon<T> {
  [key: string]: T;
}
export interface iAssetBase<T> {
  //BUSD: T;
  WETH: T;
  DAI: T;
  USDC: T;
  //USDT: T;
}

export type iAssetsWithoutETH<T> = Omit<iAssetBase<T>, "ETH">;

export type iAssetsWithoutUSD<T> = Omit<iAssetBase<T>, "USD">;

export type iUnlockdPoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  | "WETH"
  | "DAI"
  //| 'BUSD'
  | "USDC"
  //| 'USDT'
>;

export type iMultiPoolsAssets<T> = iAssetCommon<T> | iUnlockdPoolAssets<T>;

export type iUnlockdPoolTokens<T> = Omit<iUnlockdPoolAssets<T>, "ETH">;

export type iAssetAggregatorBase<T> = iAssetsWithoutETH<T>;

export enum TokenContractId {
  WETH = "WETH",
  DAI = "DAI",
  //BUSD = 'BUSD',
  USDC = "USDC",
  //USDT = 'USDT',
}

export interface iNftCommon<T> {
  [key: string]: T;
}
export interface iNftBase<T> {
  WPUNKS: T;
  BAYC: T;
  DOODLE: T;
  AZUKI: T;
  /* COOL: T;
  MEEBITS: T;
  MAYC: T;
  WOW: T;
  CLONEX: T;
  KONGZ: T;
  LAND: T; */
}

export type iMultiPoolsNfts<T> = iNftCommon<T> | iUnlockdPoolNfts<T>;

export type iUnlockdPoolNfts<T> = iNftBase<T>;

export type iNftAggregatorBase<T> = iNftBase<T>;

export enum NftContractId {
  WPUNKS = "WPUNKS",
  BAYC = "BAYC",
  DOODLE = "DOODLE",
  AZUKI = "AZUKI",
  /* COOL = "COOL",
  MEEBITS = "MEEBITS",
  MAYC = "MAYC",
  WOW = "WOW",
  CLONEX = "CLONEX",
  KONGZ = "KONGZ",
  LAND = "LAND", */
}

export interface IReserveParams
  extends IReserveBorrowParams,
    IReserveCollateralParams {
  uTokenImpl: eContractid;
  reserveFactor: string;
  strategy: IInterestRateStrategyParams;
}

export interface INftParams extends INftAuctionParams, INftCollateralParams {
  uNftImpl: eContractid;
  tokenId: string;
  maxSupply: string;
  maxTokenId: string;
}

export interface IInterestRateStrategyParams {
  name: string;
  optimalUtilizationRate: string;
  baseVariableBorrowRate: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
}

export interface IReserveBorrowParams {
  borrowingEnabled: boolean;
  reserveDecimals: string;
}

export interface IReserveCollateralParams {
  baseLTVAsCollateral: string;
  liquidationThreshold: string;
  liquidationBonus: string;
}

export interface INftCollateralParams {
  baseLTVAsCollateral: string;
  liquidationThreshold: string;
  liquidationBonus: string;
}

export interface IConfigNftAsCollateralInput {
  asset: string;
  nftTokenId: string;
  newPrice: BigNumber;
  ltv: number;
  liquidationThreshold: number;
  redeemThreshold: number;
  liquidationBonus: number;
  redeemDuration: number;
  auctionDuration: number;
  redeemFine: number;
  minBidFine: number;
}

export interface INftAuctionParams {
  redeemDuration: string;
  auctionDuration: string;
  redeemFine: string;
  redeemThreshold: string;
  minBidFine: string;
}

export type iParamsPerNetwork<T> = iEthereumParamsPerNetwork<T>;

export type iParamsPerNetworkAll<T> = iEthereumParamsPerNetwork<T>;

export interface iEthereumParamsPerNetwork<T> {
  [eEthereumNetwork.hardhat]: T;
  [eEthereumNetwork.localhost]: T;
  [eEthereumNetwork.goerli]: T;
  [eEthereumNetwork.main]: T;
}

export interface iParamsPerPool<T> {
  [UnlockdPools.proto]: T;
}

export interface iBasicDistributionParams {
  receivers: string[];
  percentages: string[];
}

export interface ObjectString {
  [key: string]: string;
}

export interface IProtocolGlobalConfig {
  MockUsdPrice: string;
  UsdAddress: tEthereumAddress;
  NilAddress: tEthereumAddress;
  OneAddress: tEthereumAddress;
}

export interface IMocksConfig {
  UNftNamePrefix: string;
  UNftSymbolPrefix: string;
  AllAssetsInitialPrices: iAssetBase<string>;
  AllNftsInitialPrices: iNftBase<string>;
  AllNftsMaxSupply: iNftBase<string>;
}

export interface ICommonConfiguration {
  MarketId: string;
  UTokenNamePrefix: string;
  UTokenSymbolPrefix: string;
  DebtTokenNamePrefix: string;
  DebtTokenSymbolPrefix: string;

  ProviderId: number;
  ProtocolGlobalParams: IProtocolGlobalConfig;
  Mocks: IMocksConfig;

  ProxyAdminPool: iParamsPerNetwork<tEthereumAddress | undefined>;
  ProxyAdminFund: iParamsPerNetwork<tEthereumAddress | undefined>;

  UNFTRegistry: iParamsPerNetwork<tEthereumAddress | undefined>;

  ProviderRegistry: iParamsPerNetwork<tEthereumAddress | undefined>;
  ProviderRegistryOwner: iParamsPerNetwork<tEthereumAddress | undefined>;

  ReserveOracle: iParamsPerNetwork<tEthereumAddress | undefined>;
  NFTOracle: iParamsPerNetwork<tEthereumAddress | undefined>;

  PoolAdmin: iParamsPerNetwork<tEthereumAddress | undefined>;
  PoolAdminIndex: number;
  EmergencyAdmin: iParamsPerNetwork<tEthereumAddress | undefined>;
  EmergencyAdminIndex: number;
  LendPoolLiquidator: iParamsPerNetwork<tEthereumAddress | undefined>;
  LendPoolLiquidatorIndex: number;
  LtvManager: iParamsPerNetwork<tEthereumAddress | undefined>;
  LtvManagerIndex: number;

  ReserveAggregators: iParamsPerNetwork<ITokenAddress>;
  ReserveAssets: iParamsPerNetwork<SymbolMap<tEthereumAddress>>;
  ReservesConfig: iMultiPoolsAssets<IReserveParams>;
  NftsAssets: iParamsPerNetwork<SymbolMap<tEthereumAddress>>;
  NftsConfig: iMultiPoolsNfts<INftParams>;

  WrappedNativeToken: iParamsPerNetwork<tEthereumAddress>;

  CryptoPunksMarket: iParamsPerNetwork<tEthereumAddress>;
  WrappedPunkToken: iParamsPerNetwork<tEthereumAddress>;

  ReserveFactorTreasuryAddress: iParamsPerNetwork<tEthereumAddress>;
  IncentivesController: iParamsPerNetwork<tEthereumAddress>;
  DebtTokenImplementation?: iParamsPerNetwork<tEthereumAddress>;

  OracleQuoteCurrency: string;
  OracleQuoteUnit: string;

  NFTXVaultFactory: iParamsPerNetwork<tEthereumAddress>;
  SushiSwapRouter: iParamsPerNetwork<tEthereumAddress>;
  LSSVMRouter: iParamsPerNetwork<tEthereumAddress>;
}

export interface IUnlockdConfiguration extends ICommonConfiguration {
  ReservesConfig: iUnlockdPoolAssets<IReserveParams>;
  NftsConfig: iUnlockdPoolNfts<INftParams>;
}

export interface ITokenAddress {
  [token: string]: tEthereumAddress;
}

export type PoolConfiguration = ICommonConfiguration | IUnlockdConfiguration;
