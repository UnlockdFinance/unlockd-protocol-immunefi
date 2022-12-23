import { BytesLike } from "@ethersproject/bytes";
import { MockContract } from "ethereum-waffle";
import { Contract } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  BorrowLogicFactory,
  ConfiguratorLogicFactory,
  CryptoPunksMarketFactory,
  CustomERC721,
  CustomERC721Factory,
  DebtTokenFactory,
  GenericLogicFactory,
  InterestRateFactory,
  LendPoolAddressesProviderFactory,
  LendPoolAddressesProviderRegistryFactory,
  LendPoolConfiguratorFactory,
  LendPoolFactory,
  LendPoolLoanFactory,
  LiquidateLogicFactory,
  MintableERC20,
  MintableERC20Factory,
  MintableERC721,
  MintableERC721Factory,
  MockChainlinkOracleFactory,
  MockIncentivesControllerFactory,
  MockNFTOracleFactory,
  MockReserveOracleFactory,
  NFTOracleFactory,
  NFTXVaultFactoryV2Factory,
  PunkGatewayFactory,
  RepayAndTransferHelperFactory,
  ReserveLogicFactory,
  ReserveOracleFactory,
  //NftLogicFactory,
  SelfdestructTransferFactory,
  SupplyLogicFactory,
  TimelockControllerFactory,
  UiPoolDataProviderFactory,
  UNFTFactory,
  UNFTRegistryFactory,
  UniswapV2FactoryFactory,
  UniswapV2Router02Factory,
  UnlockdCollectorFactory,
  UnlockdProtocolDataProviderFactory,
  UnlockdProxyAdminFactory,
  UnlockdUpgradeableProxyFactory,
  UTokenFactory,
  WalletBalanceProviderFactory,
  WETH9,
  WETH9Factory,
  WETH9Mocked,
  WETH9MockedFactory,
  WETHGatewayFactory,
  WrappedPunk,
  WrappedPunkFactory,
} from "../types";
import { LendPoolLibraryAddresses } from "../types/LendPoolFactory";
import {
  ConfigNames,
  getReservesConfigByPool,
  loadPoolConfig,
} from "./configuration";
import { ZERO_ADDRESS } from "./constants";
import { getDeploySigner } from "./contracts-getters";
import {
  getContractAddressInDb,
  getOptionalParamAddressPerNetwork,
  insertContractAddressInDb,
  linkBytecode,
  registerContractInJsonDb,
  withSaveAndVerify,
} from "./contracts-helpers";
import { DRE, notFalsyOrZeroAddress } from "./misc-utils";
import {
  eContractid,
  eNetwork,
  INftParams,
  IReserveParams,
  NftContractId,
  tEthereumAddress,
  TokenContractId,
  UnlockdPools,
} from "./types";

const readArtifact = async (id: string) => {
  return (DRE as HardhatRuntimeEnvironment).artifacts.readArtifact(id);
};

export const deployLendPoolAddressesProviderRegistry = async (
  verify?: boolean
) =>
  withSaveAndVerify(
    await new LendPoolAddressesProviderRegistryFactory(
      await getDeploySigner()
    ).deploy(),
    eContractid.LendPoolAddressesProviderRegistry,
    [],
    verify
  );

export const deployLendPoolAddressesProvider = async (
  marketId: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new LendPoolAddressesProviderFactory(await getDeploySigner()).deploy(
      marketId
    ),
    eContractid.LendPoolAddressesProvider,
    [marketId],
    verify
  );

export const deployLendPoolConfigurator = async (verify?: boolean) => {
  const cfgLogicAddress = await getContractAddressInDb(
    eContractid.ConfiguratorLogic
  );

  const libraries = {
    [PLACEHOLDER_CONFIGURATOR_LOGIC]: cfgLogicAddress,
  };

  const lendPoolConfiguratorImpl = await new LendPoolConfiguratorFactory(
    libraries,
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendPoolConfiguratorImpl,
    lendPoolConfiguratorImpl.address
  );
  return withSaveAndVerify(
    lendPoolConfiguratorImpl,
    eContractid.LendPoolConfigurator,
    [],
    verify
  );
};

export const deployLendPoolLoan = async (verify?: boolean) => {
  const lendPoolLoanImpl = await new LendPoolLoanFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendPoolLoanImpl,
    lendPoolLoanImpl.address
  );
  return withSaveAndVerify(
    lendPoolLoanImpl,
    eContractid.LendPoolLoan,
    [],
    verify
  );
};

export const deployUNFTRegistry = async (verify?: boolean) => {
  const unftRegistryImpl = await new UNFTRegistryFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.UNFTRegistryImpl,
    unftRegistryImpl.address
  );
  return withSaveAndVerify(
    unftRegistryImpl,
    eContractid.UNFTRegistry,
    [],
    verify
  );
};

export const deployReserveLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ReserveLogicFactory(await getDeploySigner()).deploy(),
    eContractid.ReserveLogic,
    [],
    verify
  );

export const deployNftLogicLibrary = async (verify?: boolean) => {
  const nftLogicArtifact = await readArtifact(eContractid.NftLogic);
  const linkedNftLogicByteCode = linkBytecode(nftLogicArtifact, {
    //[eContractid.ReserveLogic]: reserveLogic.address,
  });

  const nftLogicFactory = await DRE.ethers.getContractFactory(
    nftLogicArtifact.abi,
    linkedNftLogicByteCode
  );

  const nftLogic = await (
    await nftLogicFactory.connect(await getDeploySigner()).deploy()
  ).deployed();

  return withSaveAndVerify(nftLogic, eContractid.NftLogic, [], verify);
};

export const deployGenericLogic = async (verify?: boolean) => {
  return withSaveAndVerify(
    await new GenericLogicFactory(await getDeploySigner()).deploy(),
    eContractid.GenericLogic,
    [],
    verify
  );
};

export const deployNFTXHelperLibrary = async (verify?: boolean) => {
  const nftxHelperArtifact = await readArtifact(eContractid.NFTXHelper);
  const linkedNFTXHelperByteCode = linkBytecode(nftxHelperArtifact, {});

  const nftxHelperFactory = await DRE.ethers.getContractFactory(
    nftxHelperArtifact.abi,
    linkedNFTXHelperByteCode
  );

  const nftxHelper = await (
    await nftxHelperFactory.connect(await getDeploySigner()).deploy()
  ).deployed();

  return withSaveAndVerify(nftxHelper, eContractid.NFTXHelper, [], verify);
};

export const deployValidationLogic = async (
  reserveLogic: Contract,
  genericLogic: Contract,
  verify?: boolean
) => {
  const validationLogicArtifact = await readArtifact(
    eContractid.ValidationLogic
  );

  const linkedValidationLogicByteCode = linkBytecode(validationLogicArtifact, {
    [eContractid.ReserveLogic]: reserveLogic.address,
    [eContractid.GenericLogic]: genericLogic.address,
  });

  const validationLogicFactory = await DRE.ethers.getContractFactory(
    validationLogicArtifact.abi,
    linkedValidationLogicByteCode
  );

  const validationLogic = await (
    await validationLogicFactory.connect(await getDeploySigner()).deploy()
  ).deployed();

  return withSaveAndVerify(
    validationLogic,
    eContractid.ValidationLogic,
    [],
    verify
  );
};

export const deploySupplyLogicLibrary = async (verify?: boolean) => {
  const validateLogicAddress = await getContractAddressInDb(
    eContractid.ValidationLogic
  );
  const libraries = {
    [PLACEHOLDER_VALIDATION_LOGIC]: validateLogicAddress,
  };

  return withSaveAndVerify(
    await new SupplyLogicFactory(libraries, await getDeploySigner()).deploy(),
    eContractid.SupplyLogic,
    [],
    verify
  );
};

export const deployBorrowLogicLibrary = async (verify?: boolean) => {
  const validateLogicAddress = await getContractAddressInDb(
    eContractid.ValidationLogic
  );
  const libraries = {
    [PLACEHOLDER_VALIDATION_LOGIC]: validateLogicAddress,
  };

  return withSaveAndVerify(
    await new BorrowLogicFactory(libraries, await getDeploySigner()).deploy(),
    eContractid.BorrowLogic,
    [],
    verify
  );
};

export const deployLiquidateLogicLibrary = async (verify?: boolean) => {
  const validateLogicAddress = await getContractAddressInDb(
    eContractid.ValidationLogic
  );
  const libraries = {
    [PLACEHOLDER_VALIDATION_LOGIC]: validateLogicAddress,
  };
  return withSaveAndVerify(
    await new LiquidateLogicFactory(
      libraries,
      await getDeploySigner()
    ).deploy(),
    eContractid.LiquidateLogic,
    [],
    verify
  );
};

export const deployLiquidateMarketsLogicLibrary = async (verify?: boolean) => {
  const liquidateMarketsLogicArtifact = await readArtifact(
    eContractid.LiquidateMarketsLogic
  );
  const linkedLiquidateMarketsLogicByteCode = linkBytecode(
    liquidateMarketsLogicArtifact,
    {}
  );

  const liquidateMarketsLogicFactory = await DRE.ethers.getContractFactory(
    liquidateMarketsLogicArtifact.abi,
    linkedLiquidateMarketsLogicByteCode
  );

  const liquidateMarketsLogic = await (
    await liquidateMarketsLogicFactory.connect(await getDeploySigner()).deploy()
  ).deployed();

  return withSaveAndVerify(
    liquidateMarketsLogic,
    eContractid.LiquidateMarketsLogic,
    [],
    verify
  );
};

export const deployUnlockdLibraries = async (verify?: boolean) => {
  await deployLendPoolLibraries(verify);
  await deployConfiguratorLibraries(verify);
  //await deployLendPoolLoanLibraries(verify);
};

export const deployLendPoolLibraries = async (verify?: boolean) => {
  const genericLogic = await deployGenericLogic(verify);
  const reserveLogic = await deployReserveLogicLibrary(verify);
  const nftLogic = await deployNftLogicLibrary(verify);
  const validationLogic = await deployValidationLogic(
    reserveLogic,
    genericLogic,
    verify
  );
  const supplyLogic = await deploySupplyLogicLibrary(verify);
  const borrowLogic = await deployBorrowLogicLibrary(verify);
  const liquidateLogic = await deployLiquidateLogicLibrary(verify);
  const liquidateMarketsLogic = await deployLiquidateMarketsLogicLibrary(
    verify
  );
};

export const deployLendPoolLoanLibraries = async (verify?: boolean) => {
  const nftxHelper = await deployNFTXHelperLibrary(verify);
};

export const getLendPoolLibraries = async (
  verify?: boolean
): Promise<LendPoolLibraryAddresses> => {
  const reserveLogicAddress = await getContractAddressInDb(
    eContractid.ReserveLogic
  );
  const nftLogicAddress = await getContractAddressInDb(eContractid.NftLogic);
  const validationLogicAddress = await getContractAddressInDb(
    eContractid.ValidationLogic
  );
  const genericLogicAddress = await getContractAddressInDb(
    eContractid.GenericLogic
  );
  const supplyLogicAddress = await getContractAddressInDb(
    eContractid.SupplyLogic
  );
  const borrowLogicAddress = await getContractAddressInDb(
    eContractid.BorrowLogic
  );
  const liquidateLogicAddress = await getContractAddressInDb(
    eContractid.LiquidateLogic
  );
  const liquidateMarketsLogicAddress = await getContractAddressInDb(
    eContractid.LiquidateMarketsLogic
  );

  // Hardcoded solidity placeholders, if any library changes path this will fail.
  // The '__$PLACEHOLDER$__ can be calculated via solidity keccak, but the LendPoolLibraryAddresses Type seems to
  // require a hardcoded string.
  //
  //  how-to:
  //  1. PLACEHOLDER = solidity Keccak256(['string'], `${libPath}:${libName}`).slice(2, 36)
  //  2. LIB_PLACEHOLDER = `__$${PLACEHOLDER}$__`
  // or grab placeholdes from LendPoolLibraryAddresses at Typechain generation.
  //
  // libPath example: contracts/libraries/logic/GenericLogic.sol
  // libName example: GenericLogic
  return {
    //[PLACEHOLDER_GENERIC_LOGIC]: genericLogic.address,
    //[PLACEHOLDER_VALIDATION_LOGIC]: validationLogicAddress,
    [PLACEHOLDER_RESERVE_LOGIC]: reserveLogicAddress,
    [PLACEHOLDER_NFT_LOGIC]: nftLogicAddress,
    [PLACEHOLDER_SUPPLY_LOGIC]: supplyLogicAddress,
    [PLACEHOLDER_BORROW_LOGIC]: borrowLogicAddress,
    [PLACEHOLDER_LIQUIDATE_LOGIC]: liquidateLogicAddress,
    [PLACEHOLDER_LIQUIDATE_MARKETS_LOGIC]: liquidateMarketsLogicAddress,
  };
};

const PLACEHOLDER_GENERIC_LOGIC = "__$4c26be947d349222af871a3168b3fe584b$__";
const PLACEHOLDER_VALIDATION_LOGIC = "__$5201a97c05ba6aa659e2f36a933dd51801$__";
const PLACEHOLDER_CONFIGURATOR_LOGIC =
  "__$3b2ad8f1ea56cc7a60e9a93596bbfe9178$__";
const PLACEHOLDER_RESERVE_LOGIC = "__$d3b4366daeb9cadc7528af6145b50b2183$__";
const PLACEHOLDER_NFT_LOGIC = "__$eceb79063fab52ea3826f3ee75ecd7f36d$__";
const PLACEHOLDER_SUPPLY_LOGIC = "__$2f7c76ee15bdc1d8f3b34a04b86951fc56$__";
const PLACEHOLDER_BORROW_LOGIC = "__$77c5a84c43428e206d5bf08427df63fefa$__";
const PLACEHOLDER_LIQUIDATE_LOGIC = "__$ce70b23849b5cbed90e6e2f622d8887206$__";
const PLACEHOLDER_LIQUIDATE_MARKETS_LOGIC =
  "__$c15a8e9c5d7316be199525d6743e45041d$__";

export const deployConfiguratorLibraries = async (verify?: boolean) => {
  const cfgLogic = await deployConfiguratorLogicLibrary(verify);
};

export const deployConfiguratorLogicLibrary = async (verify?: boolean) => {
  return withSaveAndVerify(
    await new ConfiguratorLogicFactory(await getDeploySigner()).deploy(),
    eContractid.ConfiguratorLogic,
    [],
    verify
  );
};

export const deployLendPool = async (verify?: boolean) => {
  const libraries = await getLendPoolLibraries(verify);
  const lendPoolImpl = await new LendPoolFactory(
    libraries,
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendPoolImpl,
    lendPoolImpl.address
  );
  return withSaveAndVerify(lendPoolImpl, eContractid.LendPool, [], verify);
};

export const deployReserveOracle = async (args: [], verify?: boolean) => {
  const oracleImpl = await new ReserveOracleFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.ReserveOracleImpl,
    oracleImpl.address
  );
  return withSaveAndVerify(oracleImpl, eContractid.ReserveOracle, [], verify);
};

export const deployMockReserveOracle = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await new MockReserveOracleFactory(await getDeploySigner()).deploy(...args),
    eContractid.MockReserveOracle,
    args,
    verify
  );

export const deployMockChainlinkOracle = async (
  decimals: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockChainlinkOracleFactory(await getDeploySigner()).deploy(
      decimals
    ),
    eContractid.MockChainlinkOracle,
    [decimals],
    verify
  );

export const deployNFTOracle = async (verify?: boolean) => {
  const oracleImpl = await new NFTOracleFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.NFTOracleImpl,
    oracleImpl.address
  );
  return withSaveAndVerify(oracleImpl, eContractid.NFTOracle, [], verify);
};

export const deployMockNFTOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new MockNFTOracleFactory(await getDeploySigner()).deploy(),
    eContractid.MockNFTOracle,
    [],
    verify
  );

export const deployWalletBalancerProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WalletBalanceProviderFactory(await getDeploySigner()).deploy(),
    eContractid.WalletBalanceProvider,
    [],
    verify
  );

export const deployUnlockdProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new UnlockdProtocolDataProviderFactory(
      await getDeploySigner()
    ).deploy(addressesProvider),
    eContractid.UnlockdProtocolDataProvider,
    [addressesProvider],
    verify
  );

export const deployUiPoolDataProvider = async (
  reserveOracle: tEthereumAddress,
  nftOracle: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new UiPoolDataProviderFactory(await getDeploySigner()).deploy(
      reserveOracle,
      nftOracle
    ),
    eContractid.UIPoolDataProvider,
    [reserveOracle, nftOracle],
    verify
  );

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20Factory(await getDeploySigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployMintableERC721 = async (
  args: [string, string],
  verify?: boolean
): Promise<MintableERC721> =>
  withSaveAndVerify(
    await new MintableERC721Factory(await getDeploySigner()).deploy(...args),
    eContractid.MintableERC721,
    args,
    verify
  );

export const deployCustomERC721 = async (
  args: [string, string],
  verify?: boolean
): Promise<CustomERC721> =>
  withSaveAndVerify(
    await new CustomERC721Factory(await getDeploySigner()).deploy(...args),
    eContractid.CustomERC721,
    args,
    verify
  );

export const deployInterestRate = async (
  args: [tEthereumAddress, string, string, string, string],
  verify: boolean
) =>
  withSaveAndVerify(
    await new InterestRateFactory(await getDeploySigner()).deploy(...args),
    eContractid.InterestRate,
    args,
    verify
  );

export const deployGenericDebtToken = async (verify?: boolean) =>
  withSaveAndVerify(
    await new DebtTokenFactory(await getDeploySigner()).deploy(),
    eContractid.DebtToken,
    [],
    verify
  );

export const deployGenericUTokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new UTokenFactory(await getDeploySigner()).deploy(),
    eContractid.UToken,
    [],
    verify
  );

export const deployGenericUNFTImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new UNFTFactory(await getDeploySigner()).deploy(),
    eContractid.UNFT,
    [],
    verify
  );

export const deployAllMockTokens = async (
  forTestCases: boolean,
  verify?: boolean
) => {
  const tokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked | WETH9;
  } = {};

  const protoConfigData = getReservesConfigByPool(UnlockdPools.proto);

  for (const tokenSymbol of Object.keys(TokenContractId)) {
    const tokenName = "Unlockd Mock " + tokenSymbol;

    if (tokenSymbol === "WETH") {
      if (forTestCases) {
        tokens[tokenSymbol] = await deployWETHMocked();
      } else {
        tokens[tokenSymbol] = await deployWETH9();
      }
      await registerContractInJsonDb(
        tokenSymbol.toUpperCase(),
        tokens[tokenSymbol]
      );
      continue;
    }

    const decimals = "18";

    const configData = (<any>protoConfigData)[tokenSymbol];

    tokens[tokenSymbol] = await deployMintableERC20(
      [
        tokenName,
        tokenSymbol,
        configData ? configData.reserveDecimals : decimals,
      ],
      verify
    );
    await registerContractInJsonDb(
      tokenSymbol.toUpperCase(),
      tokens[tokenSymbol]
    );
  }
  return tokens;
};

export const deployAllMockNfts = async (verify?: boolean, custom?: boolean) => {
  const tokens: {
    [symbol: string]:
      | MockContract
      | MintableERC721
      | WrappedPunk
      | CustomERC721;
  } = {};

  for (const tokenSymbol of Object.keys(NftContractId)) {
    const tokenName = "Unlockd Mock " + tokenSymbol;
    if (tokenSymbol === "WPUNKS") {
      const cryptoPunksMarket = await deployCryptoPunksMarket([], verify);
      const wrappedPunk = await deployWrappedPunk(
        [cryptoPunksMarket.address],
        verify
      );
      tokens[tokenSymbol] = wrappedPunk;
      await registerContractInJsonDb(
        tokenSymbol.toUpperCase(),
        tokens[tokenSymbol]
      );
      continue;
    }
    if (custom) {
      //if (tokenSymbol === "BAYC") {
      //  console.log("Deploying BAYC...");
      console.log(tokenName);
      console.log(tokenSymbol);
      tokens[tokenSymbol] = await deployCustomERC721(
        [tokenName, tokenSymbol],
        verify
      );
      //}
    } else {
      tokens[tokenSymbol] = await deployMintableERC721(
        [tokenName, tokenSymbol],
        verify
      );
    }

    await registerContractInJsonDb(
      tokenSymbol.toUpperCase(),
      tokens[tokenSymbol]
    );
  }
  return tokens;
};

export const deployWETHGateway = async (verify?: boolean) => {
  const wethImpl = await new WETHGatewayFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.WETHGatewayImpl,
    wethImpl.address
  );
  return withSaveAndVerify(wethImpl, eContractid.WETHGateway, [], verify);
};

export const deployWETH9 = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WETH9Factory(await getDeploySigner()).deploy(),
    eContractid.WETH,
    [],
    verify
  );

export const deployWETHMocked = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WETH9MockedFactory(await getDeploySigner()).deploy(),
    eContractid.WETHMocked,
    [],
    verify
  );

export const deploySelfdestructTransferMock = async (verify?: boolean) =>
  withSaveAndVerify(
    await new SelfdestructTransferFactory(await getDeploySigner()).deploy(),
    eContractid.SelfdestructTransferMock,
    [],
    verify
  );

export const chooseUTokenDeployment = (id: eContractid) => {
  switch (id) {
    case eContractid.UToken:
      return deployGenericUTokenImpl;
    //case eContractid.DelegationAwareUToken:
    //  return deployDelegationAwareUTokenImpl;
    default:
      throw Error(`Missing uToken implementation deployment script for: ${id}`);
  }
};

export const deployUTokenImplementations = async (
  pool: ConfigNames,
  reservesConfig: { [key: string]: IReserveParams },
  verify = false
) => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;

  // Obtain the different UToken implementations of all reserves inside the Market config
  const tokenImplementations = [
    ...Object.entries(reservesConfig).reduce<Set<eContractid>>(
      (acc, [, entry]) => {
        acc.add(entry.uTokenImpl);
        return acc;
      },
      new Set<eContractid>()
    ),
  ];

  for (let x = 0; x < tokenImplementations.length; x++) {
    const tokenAddress = getOptionalParamAddressPerNetwork(
      poolConfig[tokenImplementations[x].toString()],
      network
    );
    if (!notFalsyOrZeroAddress(tokenAddress)) {
      const deployImplementationMethod = chooseUTokenDeployment(
        tokenImplementations[x]
      );
      console.log(`Deploying UToken implementation`, tokenImplementations[x]);
      await deployImplementationMethod(verify);
    }
  }

  // Debt tokens, for now all Market configs follows same implementations
  const genericDebtTokenAddress = getOptionalParamAddressPerNetwork(
    poolConfig.DebtTokenImplementation,
    network
  );

  if (!notFalsyOrZeroAddress(genericDebtTokenAddress)) {
    await deployGenericDebtToken(verify);
  }
};

export const chooseUNFTDeployment = (id: eContractid) => {
  switch (id) {
    case eContractid.UNFT:
      return deployGenericUNFTImpl;
    //case eContractid.DelegationAwareUNFT:
    //  return deployDelegationAwareUNFTImpl;
    default:
      throw Error(`Missing uNFT implementation deployment script for: ${id}`);
  }
};

export const deployUNFTImplementations = async (
  pool: ConfigNames,
  NftsConfig: { [key: string]: INftParams },
  verify = false
) => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;

  // Obtain the different UNFT implementations of all nfts inside the Market config
  const uNftImplementations = [
    ...Object.entries(NftsConfig).reduce<Set<eContractid>>((acc, [, entry]) => {
      acc.add(entry.uNftImpl);
      return acc;
    }, new Set<eContractid>()),
  ];

  for (let x = 0; x < uNftImplementations.length; x++) {
    const uNftAddress = getOptionalParamAddressPerNetwork(
      poolConfig[uNftImplementations[x].toString()],
      network
    );
    if (!notFalsyOrZeroAddress(uNftAddress)) {
      const deployImplementationMethod = chooseUNFTDeployment(
        uNftImplementations[x]
      );
      console.log(`Deploying UNFT implementation`, uNftImplementations[x]);
      await deployImplementationMethod(verify);
    }
  }
};

export const deployRateStrategy = async (
  strategyName: string,
  args: [tEthereumAddress, string, string, string, string],
  verify: boolean
): Promise<tEthereumAddress> => {
  switch (strategyName) {
    default:
      return await (
        await deployInterestRate(args, verify)
      ).address;
  }
};

export const deployCryptoPunksMarket = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await new CryptoPunksMarketFactory(await getDeploySigner()).deploy(...args),
    eContractid.CryptoPunksMarket,
    args,
    verify
  );

export const deployWrappedPunk = async (
  args: [tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new WrappedPunkFactory(await getDeploySigner()).deploy(...args),
    eContractid.WrappedPunk,
    args,
    verify
  );

export const deployPunkGateway = async (verify?: boolean) => {
  const punkImpl = await new PunkGatewayFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.PunkGatewayImpl,
    punkImpl.address
  );
  return withSaveAndVerify(punkImpl, eContractid.PunkGateway, [], verify);
};

export const deployUnlockdUpgradeableProxy = async (
  id: string,
  admin: tEthereumAddress,
  logic: tEthereumAddress,
  data: BytesLike,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new UnlockdUpgradeableProxyFactory(await getDeploySigner()).deploy(
      logic,
      admin,
      data
    ),
    id,
    [logic, admin, DRE.ethers.utils.hexlify(data)],
    verify
  );

export const deployUnlockdProxyAdmin = async (id: string, verify?: boolean) =>
  withSaveAndVerify(
    await new UnlockdProxyAdminFactory(await getDeploySigner()).deploy(),
    id,
    [],
    verify
  );

export const deployMockIncentivesController = async (verify?: boolean) =>
  withSaveAndVerify(
    await new MockIncentivesControllerFactory(await getDeploySigner()).deploy(),
    eContractid.MockIncentivesController,
    [],
    verify
  );

export const deployUnlockdCollector = async (args: [], verify?: boolean) => {
  const unlockdCollectorImpl = await new UnlockdCollectorFactory(
    await getDeploySigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.UnlockdCollectorImpl,
    unlockdCollectorImpl.address
  );
  return withSaveAndVerify(
    unlockdCollectorImpl,
    eContractid.UnlockdCollector,
    [],
    verify
  );
};

export const deployTimelockController = async (
  id: string,
  minDelay: string,
  proposers: string[],
  executors: string[],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new TimelockControllerFactory(await getDeploySigner()).deploy(
      minDelay,
      proposers,
      executors
    ),
    id,
    [minDelay, proposers, executors],
    verify
  );

export const deployRepayAndTransferHelper = async (
  addressesProvider: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new RepayAndTransferHelperFactory(await getDeploySigner()).deploy(
      addressesProvider
    ),
    eContractid.RepayAndTransferHelper,
    [addressesProvider],
    verify
  );

export const deployNFTXVaultFactory = async (verify?: boolean) => {
  const deployer = await getDeploySigner();
  const deployerAddress = await deployer.getAddress();

  return withSaveAndVerify(
    await new NFTXVaultFactoryV2Factory(deployer).deploy(deployerAddress),
    eContractid.NFTXVaultFactory,
    [deployerAddress],
    verify
  );
};

const deployUniswapV2Factory = async (verify?: boolean) => {
  const deployer = await getDeploySigner();
  const deployerAddress = await deployer.getAddress();

  return withSaveAndVerify(
    await new UniswapV2FactoryFactory(deployer).deploy(deployerAddress),
    eContractid.UniswapV2Factory,
    [deployerAddress],
    verify
  );
};

export const deploySushiSwapRouter = async (verify?: boolean) => {
  const deployer = await getDeploySigner();

  const uniswapV2Factory = await deployUniswapV2Factory();

  return withSaveAndVerify(
    await new UniswapV2Router02Factory(deployer).deploy(
      uniswapV2Factory.address,
      ZERO_ADDRESS
    ),
    eContractid.SushiSwapRouter,
    [uniswapV2Factory.address, ZERO_ADDRESS],
    verify
  );
};
