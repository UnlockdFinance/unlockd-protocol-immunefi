import {
  MOCK_NFT_AGGREGATORS_MAXSUPPLY,
  MOCK_NFT_AGGREGATORS_PRICES,
  MOCK_RESERVE_AGGREGATORS_PRICES,
  oneEther,
  ZERO_ADDRESS,
} from "../../helpers/constants";
import { eEthereumNetwork, ICommonConfiguration } from "../../helpers/types";

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: "Commons",
  UTokenNamePrefix: "Unlockd interest bearing",
  UTokenSymbolPrefix: "unlockd",
  DebtTokenNamePrefix: "Unlockd debt bearing",
  DebtTokenSymbolPrefix: "unlockdDebt",

  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: "ETH",
  OracleQuoteUnit: oneEther.toString(),
  ProtocolGlobalParams: {
    MockUsdPrice: "425107839690",
    UsdAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", //index 19, lowercase
    NilAddress: "0x0000000000000000000000000000000000000000",
    OneAddress: "0x0000000000000000000000000000000000000001",
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    UNftNamePrefix: "Unlock Bound NFT",
    UNftSymbolPrefix: "UBound",
    AllAssetsInitialPrices: {
      ...MOCK_RESERVE_AGGREGATORS_PRICES,
    },
    AllNftsInitialPrices: {
      ...MOCK_NFT_AGGREGATORS_PRICES,
    },
    AllNftsMaxSupply: {
      ...MOCK_NFT_AGGREGATORS_MAXSUPPLY,
    },
  },

  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  ProxyAdminPool: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: undefined,
  },
  ProxyAdminFund: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: '',
    [eEthereumNetwork.main]: undefined,
  },

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.hardhat]: "0x5b69E6884C70f42819Fb35Bf3C25578ee11AAA15",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.hardhat]: "0x51d25beeef0193c96cfda7fff9bd7411c2bdbdd3",
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  EmergencyAdminIndex: 1,
  LendPoolLiquidator: {
    [eEthereumNetwork.hardhat]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  LendPoolLiquidatorIndex: 0,
  LtvManager: {
    // The wallet address that will be set as loan to value Manager
    [eEthereumNetwork.hardhat]: "0x392b30d9c3ac1ef8dac7dfc394311fb9e5554c53",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  LtvManagerIndex: 0,

  UNFTRegistry: {
    /// Add contract From U
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },

  ProviderRegistry: {
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.hardhat]: "0x5b69e6884c70f42819fb35bf3c25578ee11aaa15",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },

  ReserveOracle: {
    [eEthereumNetwork.hardhat]: "", /// LEND POOL ADDRESS PROVIDER REGISTRY
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  NFTOracle: {
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },

  ReserveAggregators: {
    // https://data.chain.link/ethereum/mainnet/crypto-eth
    // https://docs.chain.link/docs/ethereum-addresses/
    [eEthereumNetwork.hardhat]: {
      DAI: "0x0d79df66BE487753B02D015Fb622DED7f0E9798d",
      USDC: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7",
      USD: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    [eEthereumNetwork.localhost]: {
      DAI: "0x53933349dA8E97b77c1f43Ba01192adb8C510fA7",
      USDC: "0x51998F16F707a0cdd5ECE2a56c034552dF3fb855",
      USD: "0x8e090D5B023252bE8d05d4c33b959A6F4A8BdD9e",
    },
    [eEthereumNetwork.goerli]: {
      DAI: "0x0d79df66BE487753B02D015Fb622DED7f0E9798d", // DAI - USD
      USDC: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7", // USDC - USD
      USD: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", // ETH - USD
    },
    [eEthereumNetwork.main]: {
      DAI: "0x773616e4d11a78f511299002da57a0a94577f1f4",
      USDC: "0x986b5e1e1755e3c2440e960477f25201b0a8bbd4",
      USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //ETH - USD
    },
  },
  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {},
  },
  ReservesConfig: {},
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.main]: {},
  },
  NftsConfig: {},
  WrappedNativeToken: {
    //WETH
    [eEthereumNetwork.hardhat]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // deployed in local evm
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  CryptoPunksMarket: {
    // hardhat dev:deploy-mock-nfts
    [eEthereumNetwork.hardhat]: "", // deployed in local evm
    [eEthereumNetwork.localhost]: "0xb2f97A3c2E48cd368901657e31Faaa93035CE390",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  WrappedPunkToken: {
    [eEthereumNetwork.hardhat]: "0xa9ED41c141d04647276F24EE06258e57a041a158", 
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.hardhat]: "0xb37c26638305f8b3d9c4c316f46caf9bdea8a47b", // from hardhat node
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  IncentivesController: {
    [eEthereumNetwork.hardhat]: "0xaa46E190C34B4f65b1f5d702Fac021b2525C93a5",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "",
    [eEthereumNetwork.main]: "",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  NFTXVaultFactory: {
    [eEthereumNetwork.hardhat]: "0xe01Cf5099e700c282A56E815ABd0C4948298Afae", //goerli address for forking tests
    [eEthereumNetwork.localhost]: "0x2cC3790f7CF280fA898E4913CA980410cF38e53b",
    [eEthereumNetwork.goerli]: "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",
    [eEthereumNetwork.main]: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  SushiSwapRouter: {
    [eEthereumNetwork.hardhat]: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", //goerli address for forking tests
    [eEthereumNetwork.localhost]: "0x6B8dcBD1bb131ED184221902df1Fe21019ccD7dc",
    [eEthereumNetwork.goerli]: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    [eEthereumNetwork.main]: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  },
  // DO NOT CHANGE THIS ADDRESSES, THEY'RE THE REAL PROTOCOL CONTRACT ADDRESSES
  LSSVMRouter: {
    [eEthereumNetwork.hardhat]: "0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F", //goerli address for forking tests
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F",
    [eEthereumNetwork.main]: "0x2b2e8cda09bba9660dca5cb6233787738ad68329",
  },
};