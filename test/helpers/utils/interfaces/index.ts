import BigNumber from "bignumber.js";

export interface UserReserveData {
  scaledUTokenBalance: BigNumber;
  currentUTokenBalance: BigNumber;
  currentVariableDebt: BigNumber;
  scaledVariableDebt: BigNumber;
  liquidityRate: BigNumber;
  walletBalance: BigNumber;
  [key: string]: BigNumber | string | boolean;
}

export interface ReserveData {
  address: string;
  symbol: string;
  decimals: BigNumber;
  totalLiquidity: BigNumber;
  availableLiquidity: BigNumber;
  totalVariableDebt: BigNumber;
  scaledVariableDebt: BigNumber;
  variableBorrowRate: BigNumber;
  utilizationRate: BigNumber;
  liquidityIndex: BigNumber;
  variableBorrowIndex: BigNumber;
  uTokenAddress: string;
  lastUpdateTimestamp: BigNumber;
  liquidityRate: BigNumber;
  [key: string]: BigNumber | string;
}

export interface NftData {
  address: string;
  symbol: string;
  unftTokenAddress: string;
  redeemFine: BigNumber;
  [key: string]: BigNumber | string;
}

export interface LoanData {
  loanId: BigNumber;
  state: BigNumber;
  borrower: string;
  nftAsset: string;
  nftTokenId: BigNumber;
  reserveAsset: string;
  scaledAmount: BigNumber;
  currentAmount: BigNumber;
  bidderAddress: string;
  bidPrice: BigNumber;
  bidBorrowAmount: BigNumber;
  bidFine: BigNumber;
  nftCfgRedeemFine: BigNumber;
  nftCfgMinBidFine: BigNumber;
  [key: string]: BigNumber | string | boolean;
}
