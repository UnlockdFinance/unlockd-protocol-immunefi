import { BigNumber, Contract, Wallet } from "ethers";
import { IConfigNftAsCollateralInput } from "../../helpers/types";
import { Contracts } from "./constants";

//#endregion

//#region  Reserves Mintable ERC20
const approve = async (
  wallet: Wallet,
  token: Contract,
  spender: string,
  amount: string
) => {
  const gas = await token.connect(wallet).estimateGas.approve(spender, amount);
  const strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  return token
    .connect(wallet)
    .approve(spender, amount, { gasLimit: gasPrice.toFixed(0) });
};

const getBalance = async (wallet: Wallet, token: Contract, address: string) => {
  return token.connect(wallet).balanceOf(address);
};
//#endregion

//#region  Nfts Mintable ERC721
const approveNft = async (
  wallet: Wallet,
  nftAddress: Contract,
  to: string,
  tokenId: string
) => {
  return nftAddress.connect(wallet).approve(to, tokenId);
};

const getApprovedNft = async (
  wallet: Wallet,
  nftAddress: Contract,
  tokenId: string
) => {
  return nftAddress.connect(wallet).getApproved(tokenId);
};

const setApproveForAllNft = async (
  wallet: Wallet,
  nftAddress: Contract,
  operator: string,
  approved: boolean
) => {
  return nftAddress.connect(wallet).setApprovalForAll(operator, approved);
};

const isApprovedNft = async (
  wallet: Wallet,
  nftAddress: Contract,
  owner: string,
  operator: string
) => {
  return nftAddress.connect(wallet).isApprovedForAll(owner, operator);
};

//#endregion

//#region  LendPool
const liquidate = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: string,
  amount: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .liquidate(nftAddress, tokenId, amount);
};

const triggerUserCollateral = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .triggerUserCollateral(nftAddress, tokenId, { value: 1000000000000000 });
};

const getTimeframe = async (wallet: Wallet) => {
  return Contracts.lendPoolConfigurator.connect(wallet).getTimeframe();
};

const getConfigFee = async (wallet: Wallet) => {
  return Contracts.lendPoolConfigurator.connect(wallet).getConfigFee();
};

const getNftConfigByTokenId = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getNftConfigByTokenId(nftAddress, tokenId);
};

const getReserveConfiguration = async (wallet: Wallet, asset: string) => {
  return Contracts.lendPool.connect(wallet).getReserveConfiguration(asset);
};

const getNftsList = async (wallet: Wallet) => {
  return Contracts.lendPool.connect(wallet).getNftsList();
};

const getNftConfiguration = async (wallet: Wallet, nftAddress: string) => {
  return Contracts.lendPool.connect(wallet).getNftConfiguration(nftAddress);
};

const deposit = async (
  wallet: Wallet,
  asset: string,
  amount: BigNumber,
  onBehalfOf: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .deposit(asset, amount, onBehalfOf, 0);
};

const withdraw = async (
  wallet: Wallet,
  asset: string,
  amount: BigNumber,
  to: string
) => {
  return Contracts.lendPool.connect(wallet).withdraw(asset, amount, to);
};

const borrow = async (
  wallet: Wallet,
  asset: string,
  amount: BigNumber,
  nftAddress: string,
  tokenId: number,
  onBehalfOf: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .borrow(asset, amount, nftAddress, tokenId, onBehalfOf, 0);
};

const getCollateralData = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number,
  reserve: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getNftCollateralData(nftAddress, tokenId, reserve);
};

const getDebtData = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  return Contracts.lendPool.connect(wallet).getNftDebtData(nftAddress, tokenId);
};

const redeem = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number,
  amount: number,
  bidfine: number
) => {
  const gas = await Contracts.lendPool
    .connect(wallet)
    .estimateGas.redeem(nftAddress, tokenId, amount, bidfine);
  const strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  return Contracts.lendPool
    .connect(wallet)
    .redeem(nftAddress, tokenId, amount, bidfine, {
      gasLimit: gasPrice.toFixed(0),
    });
};

const repay = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number,
  amount: number
) => {
  return Contracts.lendPool.connect(wallet).repay(nftAddress, tokenId, amount);
};
const auction = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number,
  bidprice: number,
  to: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .auction(nftAddress, tokenId, bidprice, to);
};

const getLiquidateFeePercentage = async (wallet: Wallet) => {
  return Contracts.lendPool.connect(wallet).getLiquidateFeePercentage();
};
const getNftLiquidatePrice = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getNftLiquidatePrice(nftAddress, tokenId);
};
const getNftAuctionData = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getNftAuctionData(nftAddress, tokenId);
};
const getNftData = async (wallet: Wallet, nftAddress: string) => {
  return Contracts.lendPool.connect(wallet).getNftData(nftAddress);
};
const getNftAssetConfig = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getNftAssetConfig(nftAddress, tokenId);
};
const getReserveNormalizedIncome = async (
  wallet: Wallet,
  nftAddress: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getReserveNormalizedIncome(nftAddress);
};
const getReserveNormalizedVariableDebt = async (
  wallet: Wallet,
  nftAddress: string
) => {
  return Contracts.lendPool
    .connect(wallet)
    .getReserveNormalizedVariableDebt(nftAddress);
};
const getReservesList = async (wallet: Wallet) => {
  return Contracts.lendPool.connect(wallet).getReservesList();
};
const liquidateNFTX = async (
  wallet: Wallet,
  nftAddress: string,
  tokenId: number
) => {
  const gas = await Contracts.lendPool
    .connect(wallet)
    .estimateGas.liquidateNFTX(nftAddress, tokenId);

  const strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);
  console.log(gasPrice);
  return Contracts.lendPool
    .connect(wallet)
    .liquidateNFTX(nftAddress, tokenId, { gasLimit: gasPrice.toFixed(0) });
};
//#endregion

//#region WETHGateway
const depositETH = async (
  wallet: Wallet,
  amount: number,
  onBehalfOf: string
) => {
  return Contracts.wethGateway
    .connect(wallet)
    .depositETH(onBehalfOf, 0, { value: amount });
};

const withdrawETH = async (wallet: Wallet, amount: BigNumber, to: string) => {
  const tx = await Contracts.wethGateway
    .connect(wallet)
    .withdrawETH(amount, to);
  await tx.wait();
};

const borrowETH = async (
  wallet: Wallet,
  amount: BigNumber,
  nftAddress: string,
  tokenId: number,
  onBehalfOf: string,
  nftConfigFee: BigNumber
) => {
  const gas = await Contracts.wethGateway
    .connect(wallet)
    .estimateGas.borroweth(
      amount,
      nftAddress,
      tokenId,
      onBehalfOf,
      0,
      nftConfigFee
    );

  const strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);

  return Contracts.wethGateway
    .connect(wallet)
    .borrowETH(amount, nftAddress, tokenId, onBehalfOf, 0, nftConfigFee, {
      gasLimit: gasPrice.toFixed(0),
    });
};
//#endregion
//#region PunkGateway
const borrowETHPunks = async (
  wallet: Wallet,
  amount: BigNumber,
  punkIndex: number,
  onBehalfOf: string
) => {
  const gas = await Contracts.punkGateway
    .connect(wallet)
    .estimateGas.borrowETH(amount, punkIndex, onBehalfOf, 0);

  const strGas = gas.toString();
  const gasPrice = Math.round(parseInt(strGas) * 1.1);

  return await Contracts.punkGateway
    .connect(wallet)
    .estimateGas.borrowETH(amount, punkIndex, onBehalfOf, 0, {
      gasLimit: gasPrice.toFixed(0),
    });
};
//#endregion
//#region Lendpool loan
const getLoanIdTracker = async (wallet: Wallet) => {
  return Contracts.lendPoolLoan.connect(wallet).getLoanIdTracker();
};
const getLoan = async (wallet: Wallet, loanId: number) => {
  return Contracts.lendPoolLoan.connect(wallet).getLoan(loanId);
};
const getCollateralLoanId = async (
  wallet: Wallet,
  nftAddress: string,
  tokenid: number
) => {
  return Contracts.lendPoolLoan
    .connect(wallet)
    .getCollateralLoanId(nftAddress, tokenid);
};

//#endregion

//#region  Nftoracle
const getNftPrice = async (
  wallet: Wallet,
  nftAddress: string,
  tokenid: number
) => {
  return Contracts.nftOracle.connect(wallet).getNFTPrice(nftAddress, tokenid);
};

const setNftPrice = async (
  wallet: Wallet,
  nftAddress: string,
  tokenid: number,
  price: BigNumber
) => {
  return Contracts.nftOracle
    .connect(wallet)
    .setNFTPrice(nftAddress, tokenid, price);
};
const getNFTOracleOwner = async (wallet: Wallet) => {
  return Contracts.nftOracle.connect(wallet).owner();
};

const setPriceManagerStatus = async (
  wallet: Wallet,
  newPriceManager: string,
  val: boolean
) => {
  return Contracts.nftOracle
    .connect(wallet)
    .setPriceManagerStatus(newPriceManager, val);
};
//#endregion

//#region  Reserve Oracle
const getAssetPrice = async (wallet: Wallet, asset: string) => {
  return Contracts.reserveOracle.connect(wallet).getAssetPrice(asset);
};
//#endregion

//#region AddressProvider for any doubts in the parameters check the LendPoolAddressProvider Contract
//Addresses provider for any doubts in the parameters check the LendPoolAddressProvider Contract
const getAddress = async (wallet: Wallet, bytesAddress: string) => {
  console.log(bytesAddress);
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getAddress(bytesAddress);
};
const setAddress = async (wallet: Wallet, id: string, address: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setAddress(id, address);
};
const getMarketId = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getMarketId();
};

const setMarketId = async (wallet: Wallet, marketId: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setMarketId(marketId);
};

const getLendPool = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getLendPool();
};

const setLendPoolImpl = async (
  wallet: Wallet,
  lendpoolAddress: string,
  encodedCallData: string
) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setLendPoolImpl(lendpoolAddress, encodedCallData);
};

const getLendPoolConfigurator = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getLendPoolConfigurator();
};

const setLendPoolConfiguratorImpl = async (
  wallet: Wallet,
  lendpoolAddress: string
) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setLendPoolConfiguratorImpl(lendpoolAddress, []);
};

const getLtvManager = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getLtvManager();
};

const setLtvManager = async (wallet: Wallet, ltvAddress: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setLtvManager(ltvAddress);
};

const getLendPoolLiquidator = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getLendPoolLiquidator();
};

const setLendPoolLiquidator = async (
  wallet: Wallet,
  lendPoolLiquidatorAddress: string
) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setLendPoolLiquidator(lendPoolLiquidatorAddress);
};

const getPoolAdmin = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getPoolAdmin();
};

const setPoolAdmin = async (wallet: Wallet, admin: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setPoolAdmin(admin);
};

const getEmergencyAdmin = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getEmergencyAdmin();
};

const setEmergencyAdmin = async (wallet: Wallet, emergencyAdmin: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setEmergencyAdmin(emergencyAdmin);
};

const getReserveOracle = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getReserveOracle();
};

const setReserveOracle = async (wallet: Wallet, reserveOracle: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setReserveOracle(reserveOracle);
};

const getNFTOracle = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getNFTOracle();
};

const setNFTOracle = async (wallet: Wallet, nftOracle: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setNFTOracle(nftOracle);
};

const getLendPoolLoan = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getLendPool()
    .wait();
};

const setLendPoolLoanImpl = async (wallet: Wallet, loanAddress: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setLendPoolImpl(loanAddress, []);
};

const getUNFTRegistry = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider.connect(wallet).getUNFTRegistry();
};

const setUNFTRegistry = async (wallet: Wallet, factory: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setUNFTRegistry(factory);
};

const getIncentivesController = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getIncentivesController();
};

const setIncentivesController = async (wallet: Wallet, controller: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setIncentivesController(controller);
};

const getUIDataProvider = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getUIDataProvider();
};

const setUIDataProvider = async (wallet: Wallet, provider: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setUIDataProvider(provider);
};

const getUnlockdDataProvider = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getUnlockdDataProvider();
};

const setUnlockdDataProvider = async (wallet: Wallet, provider: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setUnlockdDataProvider(provider);
};

const getWalletBalanceProvider = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getWalletBalanceProvider();
};

const setWalletBalanceProvider = async (wallet: Wallet, provider: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setWalletBalanceProvider(provider);
};

const setProtocolDataProvider = async (
  wallet: Wallet,
  protocolDataProviderAddress: string
) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setUnlockdDataProvider(protocolDataProviderAddress);
};

const getProtocolDataProvider = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getUnlockdDataProvider();
};

const getNFTXVaultFactory = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getNFTXVaultFactory();
};

const setNFTXVaultFactory = async (wallet: Wallet, address: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setNFTXVaultFactory(address);
};

const getSushiSwapRouter = async (wallet: Wallet) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .getSushiSwapRouter();
};

const setSushiSwapRouter = async (wallet: Wallet, address: string) => {
  return Contracts.lendPoolAddressesProvider
    .connect(wallet)
    .setSushiSwapRouter(address);
};
//#endregion

//#region Interest Rates
const variableRateSlope1 = async (wallet: Wallet) => {
  return Contracts.interestRate.connect(wallet).variableRateSlope1();
};

const variableRateSlope2 = async (wallet: Wallet) => {
  return Contracts.interestRate.connect(wallet).variableRateSlope2();
};

const baseVariableBorrowRate = async (wallet: Wallet) => {
  return Contracts.interestRate.connect(wallet).baseVariableBorrowRate();
};
//#endregion

//#region UNFTRegistry
const getUNFTAddresses = async (wallet: Wallet, nftAddress: string) => {
  return Contracts.unftRegistry.connect(wallet).getUNFTAddresses(nftAddress);
};
//#endregion

//#region NFTXVault
const mintNFTX = async (
  wallet: Wallet,
  token: Contract,
  tokenIds: string[],
  amounts: string[]
) => {
  return token.connect(wallet).mint(tokenIds, amounts);
};
//#endregion

//#region LendPoolConfigurator for any doubts in the parameters
// check the LendPoolConfigurator.sol or ILendPoolconfigurator.sol
const setIsMarketSupported = async (
  wallet: Wallet,
  nftAddresses: string,
  marketId: string,
  val: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setIsMarketSupported(nftAddresses, marketId, val);
};

const setTimeframe = async (wallet: Wallet, newTimeframe: string) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setTimeframe(newTimeframe);
};

const setConfigFee = async (wallet: Wallet, configFee: BigNumber) => {
  return Contracts.lendPoolConfigurator.connect(wallet).setConfigFee(configFee);
};

const setAllowToSellNFTX = async (
  wallet: Wallet,
  nftAddress: string,
  val: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setAllowToSellNFTX(nftAddress, val);
};

const setBorrowingFlagOnReserve = async (
  wallet: Wallet,
  asset: string,
  flag: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setBorrowingFlagOnReserve(asset, flag);
};

const setActiveFlagOnReserve = async (
  wallet: Wallet,
  asset: string,
  flag: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setActiveFlagOnReserve(asset, flag);
};

const setFreezeFlagOnReserve = async (
  wallet: Wallet,
  asset: string,
  flag: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setFreezeFlagOnReserve(asset, flag);
};

const setReserveFactor = async (
  wallet: Wallet,
  asset: string,
  factor: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setReserveFactor(asset, factor);
};

const setReserveInterestRateAddress = async (
  wallet: Wallet,
  assets: string[],
  rateAddress: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setReserveInterestRateAddress(assets, rateAddress);
};

const setActiveFlagOnNft = async (
  wallet: Wallet,
  asset: string,
  flag: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setActiveFlagOnNft(asset, flag);
};

const setFreezeFlagOnNft = async (
  wallet: Wallet,
  assets: string[],
  flag: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setFreezeFlagOnNft(assets, flag);
};

const configureNftAsCollateral = async (
  wallet: Wallet,
  asset: string,
  tokenId: string,
  newPrice: BigNumber,
  ltv: string,
  liquidationThreshold: string,
  redeemThreshold: string,
  liquidationBonus: string,
  redeemDuration: string,
  auctionDuration: string,
  redeemFine: string,
  minBidFine: string
) => {
  const collData: IConfigNftAsCollateralInput = {
    asset: asset,
    nftTokenId: tokenId.toString(),
    newPrice: newPrice,
    ltv: parseInt(ltv),
    liquidationThreshold: parseInt(liquidationThreshold),
    redeemThreshold: parseInt(redeemThreshold),
    liquidationBonus: parseInt(liquidationBonus),
    redeemDuration: parseInt(redeemDuration),
    auctionDuration: parseInt(auctionDuration),
    redeemFine: parseInt(redeemFine),
    minBidFine: parseInt(minBidFine),
  };
  return await Contracts.lendPoolConfigurator
    .connect(wallet)
    .configureNftsAsCollateral([collData]);
};

const configureNftAsAuction = async (
  wallet: Wallet,
  assets: string,
  tokenId: string,
  redeemDuration: string,
  auctionDuration: string,
  redeemFine: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .configureNftAsAuction(
      assets,
      tokenId,
      redeemDuration,
      auctionDuration,
      redeemFine
    );
};

const setNftRedeemThreshold = async (
  wallet: Wallet,
  asset: string,
  tokenId: number,
  redeemThreshold: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setNftRedeemThreshold(asset, tokenId, redeemThreshold);
};

const setNftMinBidFine = async (
  wallet: Wallet,
  assets: string[],
  minBidFine: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setNftMinBidFine(assets, minBidFine);
};

const setNftMaxSupplyAndTokenId = async (
  wallet: Wallet,
  assets: string[],
  maxSupply: string,
  maxTokenId: string
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setNftMaxSupplyAndTokenId(assets, maxSupply, maxTokenId);
};

const setMaxNumberOfReserves = async (wallet: Wallet, newVal: string) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setMaxNumberOfReserves(newVal);
};

const setMaxNumberOfNfts = async (wallet: Wallet, newVal: string) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setMaxNumberOfNfts(newVal);
};

const setLiquidationFeePercentage = async (wallet: Wallet, newVal: string) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setLiquidationFeePercentage(newVal);
};

const setPoolPause = async (wallet: Wallet, val: boolean) => {
  return Contracts.lendPoolConfigurator.connect(wallet).setPoolPause(val);
};

const setLtvManagerStatus = async (
  wallet: Wallet,
  newLtvManager: string,
  val: boolean
) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .setLtvManagerStatus(newLtvManager, val);
};

const getTokenImplementation = async (wallet: Wallet, proxyAddress: string) => {
  return Contracts.lendPoolConfigurator
    .connect(wallet)
    .getTokenImplementation(proxyAddress);
};

//#endregion

//#region uToken
const RESERVE_TREASURY_ADDRESS = async (wallet: Wallet) => {
  return Contracts.uToken.connect(wallet).RESERVE_TREASURY_ADDRESS();
};
//#endregion

//          NFT's
//       asset: nftaddress,
//       maxSupply: maxsupply,
//       maxTokenId: maxtokenid,
//       baseLTV: '3000', // 30%
//       liquidationThreshold: '9000', // 90%
//       liquidationBonus: '500', // 5%
//       redeemDuration: "2", // 2 hours
//       auctionDuration: "2", // 2 hours
//       redeemFine: "500", // 5%
//       redeemThreshold: "5000", // 50%
//       minBidFine: "2000", // 0.2 ETH

/////////////////////////////////////////////////////////////////////////////////////

// Exported functions
export const Functions = {
  UTOKEN: {
    RESERVE_TREASURY_ADDRESS: RESERVE_TREASURY_ADDRESS,
  },
  RESERVES: {
    approve: approve,
    getBalance: getBalance,
  },
  NFTS: {
    approve: approveNft,
    getApprovedNft: getApprovedNft,
    setApproveForAllNft: setApproveForAllNft,
    isApprovedNft: isApprovedNft,
  },
  LENDPOOL: {
    triggerUserCollateral: triggerUserCollateral,
    getConfigFee: getConfigFee,
    getTimeframe: getTimeframe,
    getNftConfigByTokenId: getNftConfigByTokenId,
    liquidateNFTX: liquidateNFTX,
    getReserveConfiguration: getReserveConfiguration,
    getNftConfiguration: getNftConfiguration,
    getNftData: getNftData,
    getNftsList: getNftsList,
    deposit: deposit,
    withdraw: withdraw,
    borrow: borrow,
    getCollateralData: getCollateralData,
    getDebtData: getDebtData,
    getLiquidateFeePercentage: getLiquidateFeePercentage,
    redeem: redeem,
    repay: repay,
    auction: auction,
    getNftLiquidatePrice: getNftLiquidatePrice,
    getNftAuctionData: getNftAuctionData,
    getNftAssetConfig: getNftAssetConfig,
    getReserveNormalizedIncome: getReserveNormalizedIncome,
    getReserveNormalizedVariableDebt: getReserveNormalizedVariableDebt,
    getReservesList: getReservesList,
    liquidate: liquidate,
  },
  WETH_GATEWAY: {
    depositETH: depositETH,
    withdrawETH: withdrawETH,
    borrowETH: borrowETH,
  },
  PUNK_GATEWAY: {
    borrowETH: borrowETHPunks,
  },
  LENDPOOL_LOAN: {
    getLoanIdTracker: getLoanIdTracker,
    getLoan: getLoan,
    getCollateralLoanId: getCollateralLoanId,
  },
  NFTORACLE: {
    getNftPrice: getNftPrice,
    setNftPrice: setNftPrice,
    getNFTOracleOwner: getNFTOracleOwner,
    setPriceManagerStatus: setPriceManagerStatus,
  },
  RESERVEORACLE: {
    getAssetPrice: getAssetPrice,
  },
  LENDPOOLADDRESSPROVIDER: {
    getAddress: getAddress,
    setAddress: setAddress,
    getMarketId: getMarketId,
    setMarketId: setMarketId,
    getLendPool: getLendPool,
    setLendPoolImpl: setLendPoolImpl,
    getLendPoolConfigurator: getLendPoolConfigurator,
    setLendPoolConfiguratorImpl: setLendPoolConfiguratorImpl,
    getLtvManager: getLtvManager,
    setLtvManager: setLtvManager,
    setLendPoolLiquidator: setLendPoolLiquidator,
    getLendPoolLiquidator: getLendPoolLiquidator,
    setProtocolDataProvider: setProtocolDataProvider,
    getProtocolDataProvider: getProtocolDataProvider,
    getNFTXVaultFactory: getNFTXVaultFactory,
    setNFTXVaultFactory: setNFTXVaultFactory,
    getSushiSwapRouter: getSushiSwapRouter,
    setSushiSwapRouter: setSushiSwapRouter,
    getPoolAdmin: getPoolAdmin,
    setPoolAdmin: setPoolAdmin,
    getEmergencyAdmin: getEmergencyAdmin,
    setEmergencyAdmin: setEmergencyAdmin,
    getReserveOracle: getReserveOracle,
    setReserveOracle: setReserveOracle,
    getNFTOracle: getNFTOracle,
    setNFTOracle: setNFTOracle,
    getLendPoolLoan: getLendPoolLoan,
    setLendPoolLoanImpl: setLendPoolLoanImpl,
    getUNFTRegistry: getUNFTRegistry,
    setUNFTRegistry: setUNFTRegistry,
    getIncentivesController: getIncentivesController,
    setIncentivesController: setIncentivesController,
    getUIDataProvider: getUIDataProvider,
    setUIDataProvider: setUIDataProvider,
    getUnlockdDataProvider: getUnlockdDataProvider,
    setUnlockdDataProvider: setUnlockdDataProvider,
    getWalletBalanceProvider: getWalletBalanceProvider,
    setWalletBalanceProvider: setWalletBalanceProvider,
  },
  INTERESTRATE: {
    variableRateSlope1: variableRateSlope1,
    variableRateSlope2: variableRateSlope2,
    baseVariableBorrowRate: baseVariableBorrowRate,
  },
  UNFTREGISTRY: {
    getUNFTAddresses: getUNFTAddresses,
  },
  LENDPOOLCONFIGURATOR: {
    setIsMarketSupported: setIsMarketSupported,
    setConfigFee: setConfigFee,
    setTimeframe: setTimeframe,
    setActiveFlagOnNft: setActiveFlagOnNft,
    configureNftAsCollateral: configureNftAsCollateral,
    setBorrowingFlagOnReserve: setBorrowingFlagOnReserve,
    setActiveFlagOnReserve: setActiveFlagOnReserve,
    setFreezeFlagOnReserve: setFreezeFlagOnReserve,
    setReserveFactor: setReserveFactor,
    setReserveInterestRateAddress: setReserveInterestRateAddress,
    setFreezeFlagOnNft: setFreezeFlagOnNft,
    configureNftAsAuction: configureNftAsAuction,
    setNftRedeemThreshold: setNftRedeemThreshold,
    setNftMinBidFine: setNftMinBidFine,
    setNftMaxSupplyAndTokenId: setNftMaxSupplyAndTokenId,
    setMaxNumberOfReserves: setMaxNumberOfReserves,
    setMaxNumberOfNfts: setMaxNumberOfNfts,
    setLiquidationFeePercentage: setLiquidationFeePercentage,
    setPoolPause: setPoolPause,
    setLtvManagerStatus: setLtvManagerStatus,
    getTokenImplementation: getTokenImplementation,
    setAllowToSellNFTX: setAllowToSellNFTX,
  },
  NFTXVAULT: {
    mintNFTX: mintNFTX,
  },
};
