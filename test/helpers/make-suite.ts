import chai from "chai";
// @ts-ignore
import bignumberChai from "chai-bignumber";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  SUDOSWAP_PAIRS_GOERLI,
  SUDOSWAP_PAIRS_MAINNET,
} from "../../helpers/constants";
import {
  getCryptoPunksMarket,
  getLendPool,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getLSSVMPair,
  getMintableERC20,
  getMintableERC721,
  getMockChainlinkOracle,
  getMockIncentivesController,
  getMockNFTOracle,
  getMockReserveOracle,
  getNFTOracle,
  getPunkGateway,
  getReserveOracle,
  getUIPoolDataProvider,
  getUNFT,
  getUNFTRegistryProxy,
  getUnlockdProtocolDataProvider,
  getUToken,
  getWalletProvider,
  getWETHGateway,
  getWETHMocked,
  getWrappedPunk,
} from "../../helpers/contracts-getters";
import { getEthersSigners } from "../../helpers/contracts-helpers";
import {
  DRE,
  evmRevert,
  evmSnapshot,
  getNowTimeInSeconds,
} from "../../helpers/misc-utils";
import { tEthereumAddress } from "../../helpers/types";
import {
  CryptoPunksMarket,
  LendPoolLoan,
  MockIncentivesController,
  PunkGateway,
  UiPoolDataProvider,
  UNFTRegistry,
  WalletBalanceProvider,
  WrappedPunk,
} from "../../types";
import { ILSSVMPair } from "../../types/ILSSVMPair";
import { INFTXVaultFactoryV2 } from "../../types/INFTXVaultFactoryV2";
import { IUniswapV2Router02 } from "../../types/IUniswapV2Router02";
import { LendPool } from "../../types/LendPool";
import { LendPoolAddressesProvider } from "../../types/LendPoolAddressesProvider";
import { LendPoolConfigurator } from "../../types/LendPoolConfigurator";
import { MintableERC20 } from "../../types/MintableERC20";
import { MintableERC721 } from "../../types/MintableERC721";
import { MockChainlinkOracle } from "../../types/MockChainlinkOracle";
import { MockNFTOracle } from "../../types/MockNFTOracle";
import { MockReserveOracle } from "../../types/MockReserveOracle";
import { NFTOracle } from "../../types/NFTOracle";
import { ReserveOracle } from "../../types/ReserveOracle";
import { UNFT } from "../../types/UNFT";
import { UnlockdProtocolDataProvider } from "../../types/UnlockdProtocolDataProvider";
import { UToken } from "../../types/UToken";
import { WETH9Mocked } from "../../types/WETH9Mocked";
import { WETHGateway } from "../../types/WETHGateway";
import { almostEqual } from "./almost-equal";

chai.use(bignumberChai());
chai.use(almostEqual());
chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface LSSVMPairWithID {
  LSSVMPair: ILSSVMPair;
  collectionName: string;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  unftRegistry: UNFTRegistry;
  pool: LendPool;
  loan: LendPoolLoan;
  configurator: LendPoolConfigurator;
  liquidator: SignerWithAddress;
  reserveOracle: ReserveOracle;
  mockChainlinkOracle: MockChainlinkOracle;
  mockReserveOracle: MockReserveOracle;
  nftOracle: NFTOracle;
  mockNftOracle: MockNFTOracle;
  dataProvider: UnlockdProtocolDataProvider;
  uiProvider: UiPoolDataProvider;
  walletProvider: WalletBalanceProvider;
  mockIncentivesController: MockIncentivesController;
  weth: WETH9Mocked;
  uWETH: UToken;
  dai: MintableERC20;
  uDai: UToken;
  usdc: MintableERC20;
  uUsdc: UToken;
  //wpunks: WPUNKSMocked;
  uPUNK: UNFT;
  bayc: MintableERC721;
  uBAYC: UNFT;
  tokenId: number;
  addressesProvider: LendPoolAddressesProvider;
  wethGateway: WETHGateway;
  tokenIdTracker: number;

  cryptoPunksMarket: CryptoPunksMarket;
  punkIndexTracker: number;
  wrappedPunk: WrappedPunk;
  punkGateway: PunkGateway;

  roundIdTracker: number;
  nowTimeTracker: number;

  nftxVaultFactory: INFTXVaultFactoryV2;
  sushiSwapRouter: IUniswapV2Router02;
  LSSVMPairs: LSSVMPairWithID[];
}

let buidlerevmSnapshotId = "0x1";
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  unftRegistry: {} as UNFTRegistry,
  pool: {} as LendPool,
  loan: {} as LendPoolLoan,
  configurator: {} as LendPoolConfigurator,
  liquidator: {} as SignerWithAddress,
  dataProvider: {} as UnlockdProtocolDataProvider,
  uiProvider: {} as UiPoolDataProvider,
  walletProvider: {} as WalletBalanceProvider,
  mockIncentivesController: {} as MockIncentivesController,
  reserveOracle: {} as ReserveOracle,
  mockReserveOracle: {} as MockReserveOracle,
  mockNftOracle: {} as MockNFTOracle,
  nftOracle: {} as NFTOracle,
  mockChainlinkOracle: {} as MockChainlinkOracle,
  LSSVMPairs: [] as LSSVMPairWithID[],
  weth: {} as WETH9Mocked,
  uWETH: {} as UToken,
  dai: {} as MintableERC20,
  uDai: {} as UToken,
  usdc: {} as MintableERC20,
  uUsdc: {} as UToken,
  //wpunks: WPUNKSMocked,
  uPUNK: {} as UNFT,
  bayc: {} as MintableERC721,
  uBAYC: {} as UNFT,
  tokenId: {} as number,
  addressesProvider: {} as LendPoolAddressesProvider,
  wethGateway: {} as WETHGateway,
  //wpunksGateway: {} as WPUNKSGateway,
  tokenIdTracker: {} as number,
  roundIdTracker: {} as number,
  nowTimeTracker: {} as number,
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }
  testEnv.deployer = deployer;
  testEnv.liquidator = deployer;

  testEnv.unftRegistry = await getUNFTRegistryProxy();

  testEnv.pool = await getLendPool();

  testEnv.loan = await getLendPoolLoanProxy();

  testEnv.configurator = await getLendPoolConfiguratorProxy();

  testEnv.addressesProvider = await getLendPoolAddressesProvider();

  testEnv.reserveOracle = await getReserveOracle();
  testEnv.mockChainlinkOracle = await getMockChainlinkOracle();
  testEnv.mockReserveOracle = await getMockReserveOracle();
  testEnv.nftOracle = await getNFTOracle();

  testEnv.mockNftOracle = await getMockNFTOracle();

  testEnv.dataProvider = await getUnlockdProtocolDataProvider();
  testEnv.walletProvider = await getWalletProvider();
  testEnv.uiProvider = await getUIPoolDataProvider();

  testEnv.mockIncentivesController = await getMockIncentivesController();

  // Reserve Tokens
  const allReserveTokens =
    await testEnv.dataProvider.getAllReservesTokenDatas();

  const uDaiAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "DAI"
  )?.uTokenAddress;
  const uUsdcAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "USDC"
  )?.uTokenAddress;
  const uWEthAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "WETH"
  )?.uTokenAddress;

  const daiAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "DAI"
  )?.tokenAddress;
  const usdcAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "USDC"
  )?.tokenAddress;
  const wethAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "WETH"
  )?.tokenAddress;

  console.log("uDai", uDaiAddress);
  console.log("uUSDC", uUsdcAddress);
  console.log("uWETH", uWEthAddress);
  console.log("daiAdd", daiAddress);
  console.log("usdcAdd", usdcAddress);
  console.log("wethAdd", wethAddress);

  if (!uDaiAddress || !uUsdcAddress || !uWEthAddress) {
    console.error("Invalid UTokens", uDaiAddress, uUsdcAddress, uWEthAddress);
    process.exit(1);
  }
  if (!daiAddress || !usdcAddress || !wethAddress) {
    console.error(
      "Invalid Reserve Tokens",
      daiAddress,
      usdcAddress,
      wethAddress
    );
    process.exit(1);
  }

  testEnv.uDai = await getUToken(uDaiAddress);
  testEnv.uUsdc = await getUToken(uUsdcAddress);
  testEnv.uWETH = await getUToken(uWEthAddress);

  testEnv.dai = await getMintableERC20(daiAddress);
  testEnv.usdc = await getMintableERC20(usdcAddress);
  testEnv.weth = await getWETHMocked(wethAddress);
  testEnv.wethGateway = await getWETHGateway();

  // NFT Tokens
  const allUNftTokens = await testEnv.dataProvider.getAllNftsTokenDatas();
  console.log("allUNftTokens", allUNftTokens);
  const uPunkAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "WPUNKS"
  )?.uNftAddress;
  const uBaycAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "BAYC"
  )?.uNftAddress;

  const wpunksAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "WPUNKS"
  )?.nftAddress;
  const baycAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "BAYC"
  )?.nftAddress;
  console.log(baycAddress);

  if (!uBaycAddress || !uPunkAddress) {
    console.error("Invalid UNFT Tokens", uBaycAddress, uPunkAddress);
    process.exit(1);
  }
  if (!baycAddress || !wpunksAddress) {
    console.error("Invalid NFT Tokens", baycAddress, wpunksAddress);
    process.exit(1);
  }

  testEnv.uBAYC = await getUNFT(uBaycAddress);
  testEnv.uPUNK = await getUNFT(uPunkAddress);

  testEnv.bayc = await getMintableERC721(baycAddress!);
  testEnv.tokenId = 1;
  testEnv.cryptoPunksMarket = await getCryptoPunksMarket();

  testEnv.wrappedPunk = await getWrappedPunk();
  testEnv.punkGateway = await getPunkGateway();

  testEnv.tokenIdTracker = 100;
  testEnv.punkIndexTracker = 100;

  testEnv.roundIdTracker = 1;
  testEnv.nowTimeTracker = Number(await getNowTimeInSeconds());

  // NFTXVaultFactory, Sushiswap Router
  //testEnv.nftxVaultFactory = await getNFTXVaultFactory();
  //testEnv.sushiSwapRouter = await getSushiSwapRouter();

  const sudoSwapPairsForAsset =
    process.env.FORK == "goerli"
      ? SUDOSWAP_PAIRS_GOERLI
      : SUDOSWAP_PAIRS_MAINNET;

  for (const [key] of Object.entries(sudoSwapPairsForAsset)) {
    const pairsForAsset = sudoSwapPairsForAsset[key];

    pairsForAsset.map(async (pair) => {
      let pairWithID: LSSVMPairWithID = {} as LSSVMPairWithID;
      pairWithID.collectionName = key;
      pairWithID.LSSVMPair = await getLSSVMPair(pair);

      testEnv.LSSVMPairs.push(pairWithID);
    });
  }
}

const setSnapshot = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  setBuidlerevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  await evmRevert(buidlerevmSnapshotId);
};

export function makeSuite(
  name: string,
  tests: (testEnv: TestEnv) => void,
  { only, skip }: { only?: boolean; skip?: boolean } = {
    only: false,
    skip: false,
  }
) {
  (only ? describe.only : skip ? describe.skip : describe)(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}
