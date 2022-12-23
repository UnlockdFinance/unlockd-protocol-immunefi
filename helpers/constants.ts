import BigNumber from "bignumber.js";

// ----------------
// MATH
// ----------------

export const PERCENTAGE_FACTOR = "10000";
export const HALF_PERCENTAGE = "5000";
export const WAD = Math.pow(10, 18).toString();
export const HALF_WAD = new BigNumber(WAD).multipliedBy(0.5).toString();
export const RAY = new BigNumber(10).exponentiatedBy(27).toFixed();
export const HALF_RAY = new BigNumber(RAY).multipliedBy(0.5).toFixed();
export const WAD_RAY_RATIO = Math.pow(10, 9).toString();
export const oneEther = new BigNumber(Math.pow(10, 18));
export const oneRay = new BigNumber(Math.pow(10, 27));
export const MAX_UINT_AMOUNT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";
export const ONE_YEAR = "31536000";
export const ONE_DAY = "86400";
export const ONE_HOUR = "3600";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ONE_ADDRESS = "0x0000000000000000000000000000000000000001";
// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------
export const OPTIMAL_UTILIZATION_RATE = new BigNumber(0.8).times(RAY);
export const EXCESS_UTILIZATION_RATE = new BigNumber(0.2).times(RAY);
export const APPROVAL_AMOUNT_LENDING_POOL = "1000000000000000000000000000";
export const TOKEN_DISTRIBUTOR_PERCENTAGE_BASE = "10000";
export const MOCK_USD_PRICE = "425107839690";
export const USD_ADDRESS = "0x9ceb4d4c184d1786614a593a03621b7f37f8685f"; //index 19, lowercase
export const UNLOCKD_REFERRAL = "0";
export const WETH_GOERLI = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
export const WETH_MAINNET = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const FUNDED_ACCOUNT_MAINNET =
  "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5";
export const FUNDED_ACCOUNT_GOERLI =
  "0x00000000219ab540356cbb839cbe05303d7705fa";
export const FUNDED_ACCOUNT_MAINNET_WETH =
  "0x00000000219ab540356cbb839cbe05303d7705fa";
export const FUNDED_ACCOUNT_GOERLI_WETH =
  "0x2372031bb0fc735722aa4009aebf66e8beaf4ba1";
export const FUNDED_ACCOUNT_MAINNET_DAI =
  "0x075e72a5edf65f0a5f44699c7654c1a76941ddc8";
export const FUNDED_ACCOUNT_GOERLI_DAI =
  "0x75e186bd5b2605afa400beb6d45a2e9f2d9d1bf5";
export const FUNDED_ACCOUNT_MAINNET_USDC =
  "0x0a59649758aa4d66e25f08dd01271e891fe52199";
export const FUNDED_ACCOUNT_GOERLI_USDC =
  "0xddcf5659162d1e9430b84dfebceefdf3abc1b6c1";

export const SUDOSWAP_BAYC_PAIR_MAINNET_1 = "";
export const SUDOSWAP_BAYC_PAIR_MAINNET_2 = "";
export const SUDOSWAP_BAYC_PAIR_GOERLI_1 =
  "0x8ff50Ed214E05119e5E1F63f0836744772A807F7";
export const SUDOSWAP_BAYC_PAIR_GOERLI_2 =
  "0x8ff50Ed214E05119e5E1F63f0836744772A807F7";

export const FUNDED_ACCOUNTS_GOERLI = {
  ETH: FUNDED_ACCOUNT_GOERLI,
  WETH: FUNDED_ACCOUNT_GOERLI_WETH,
  DAI: FUNDED_ACCOUNT_GOERLI_DAI,
  USDC: FUNDED_ACCOUNT_GOERLI_USDC,
};

export const FUNDED_ACCOUNTS_MAINNET = {
  ETH: FUNDED_ACCOUNT_MAINNET,
  WETH: FUNDED_ACCOUNT_MAINNET_WETH,
  DAI: FUNDED_ACCOUNT_MAINNET_DAI,
  USDC: FUNDED_ACCOUNT_MAINNET_USDC,
};

export const SUDOSWAP_PAIRS_GOERLI = {
  BAYC: [SUDOSWAP_BAYC_PAIR_GOERLI_1],
};

export const SUDOSWAP_PAIRS_MAINNET = {
  BAYC: [SUDOSWAP_BAYC_PAIR_MAINNET_1, SUDOSWAP_BAYC_PAIR_MAINNET_2],
};

// ----------------
// ADDRESS IDS IN PROVIDER
// ----------------
export const ADDRESS_ID_WETH_GATEWAY =
  "0xADDE000000000000000000000000000000000000000000000000000000000001";
export const ADDRESS_ID_PUNK_GATEWAY =
  "0xADDE000000000000000000000000000000000000000000000000000000000002";

//Price source: https://data.chain.link/ethereum/mainnet/stablecoins
export const MOCK_RESERVE_AGGREGATORS_PRICES = {
  WETH: oneEther.toFixed(),
  DAI: oneEther.multipliedBy("0.000233211").toFixed(),
  //BUSD: oneEther.multipliedBy('0.0002343946').toFixed(),
  USDC: oneEther.multipliedBy("0.0002349162").toFixed(),
  //USDT: oneEther.multipliedBy('0.0002359253').toFixed(),
};

//Price source: https://nftpricefloor.com/
export const MOCK_NFT_AGGREGATORS_PRICES = {
  WPUNKS: oneEther.multipliedBy("66.99").toFixed(),
  BAYC: oneEther.multipliedBy("52.77").toFixed(),
  DOODLE: oneEther.multipliedBy("2.69").toFixed(),
  COOL: oneEther.multipliedBy("6.66").toFixed(),
  MEEBITS: oneEther.multipliedBy("2.88").toFixed(),
  MAYC: oneEther.multipliedBy("6.23").toFixed(),
  WOW: oneEther.multipliedBy("7.77").toFixed(),
  CLONEX: oneEther.multipliedBy("11.95").toFixed(),
  AZUKI: oneEther.multipliedBy("10.50").toFixed(),
  KONGZ: oneEther.multipliedBy("7.90").toFixed(),
  LAND: oneEther.multipliedBy("2.16").toFixed(),
};

export const MOCK_NFT_AGGREGATORS_MAXSUPPLY = {
  WPUNKS: "150", //10000
  BAYC: "150", //10000
  DOODLE: "150", //9999
  COOL: "150", //9999
  MEEBITS: "150", //20000
  MAYC: "150", //19422
  WOW: "150", //5555
  CLONEX: "150", //19310
  AZUKI: "150", //10000
  KONGZ: "150", //14826
  LAND: "150", //90000
};

export const MOCK_NFT_BASE_URIS = {
  WPUNKS: "https://wrappedpunks.com:3000/api/punks/metadata/",
  BAYC: "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/",
  DOODLE: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/",
  COOL: "https://api.coolcatsnft.com/cat/",
  MEEBITS: "https://meebits.larvalabs.com/meebit/1",
  MAYC: "https://boredapeyachtclub.com/api/mutants/",
  WOW: "https://wow-prod-nftribe.s3.eu-west-2.amazonaws.com/t/",
  CLONEX: "https://clonex-assets.rtfkt.com/",
  AZUKI:
    "https://ikzttp.mypinata.cloud/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/",
  KONGZ: "https://kongz.herokuapp.com/api/metadata/",
  LAND: "https://market.decentraland.org/contracts/0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d/tokens/",
};
