import { IUnlockdConfiguration, eEthereumNetwork } from "../../helpers/types";

import { CommonsConfig } from "./commons";
import { strategyWETH, strategyDAI, strategyUSDC } from "./reservesConfigs";
import {
  strategyNft_AZUKI,
  strategyNft_BAYC,
  strategyNft_CLONEX,
  strategyNft_COOL,
  strategyNft_DOODLE,
  strategyNft_KONGZ,
  strategyNft_MAYC,
  strategyNft_MEEBITS,
  strategyNft_WOW,
  strategyNft_WPUNKS,
  strategyNft_LAND,
} from "./nftsConfigs";

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const UnlockdConfig: IUnlockdConfiguration = {
  ...CommonsConfig,
  MarketId: "Unlockd genesis market",
  ProviderId: 1,
  ReservesConfig: {
    WETH: strategyWETH,
    DAI: strategyDAI,
    USDC: strategyUSDC,
  },
  NftsConfig: {
    WPUNKS: strategyNft_WPUNKS,
    BAYC: strategyNft_BAYC,
    DOODLE: strategyNft_DOODLE,
    AZUKI: strategyNft_AZUKI,
    /*  MAYC: strategyNft_MAYC,
    CLONEX: strategyNft_CLONEX,
    AZUKI: strategyNft_AZUKI,
    KONGZ: strategyNft_KONGZ,
    COOL: strategyNft_COOL,
    MEEBITS: strategyNft_MEEBITS,
    WOW: strategyNft_WOW,
    LAND: strategyNft_LAND, */
  },

  ReserveAssets: {
    [eEthereumNetwork.hardhat]: {
      WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      DAI: '0x9D233A907E065855D2A9c7d4B552ea27fB2E5a36',
      USDC: '0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557',
    },
    [eEthereumNetwork.localhost]: {
      WETH: "",
      DAI: "",
      USDC: "",
    },
    [eEthereumNetwork.goerli]: {
      WETH: "",
      //DAI: "",
      //USDC: "",
    },
    [eEthereumNetwork.main]: {
      WETH: "",
      DAI: '',
      USDC: '',
    },
  },
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {
      //dev:deploy-mock-nfts
      WPUNKS: "0xa9ED41c141d04647276F24EE06258e57a041a158",
      BAYC: "0x9278420Bf7548970799c56ef9A0B081862515330",
      //DOODLE: "0x11FC8C3fd1826f16aD154c18355bcA89a742B1C8",
      //AZUKI: "",
      // COOL: '',
      // MEEBITS: '',
      // MAYC: '',
      // WOW: '',
      // CLONEX: '',
      // KONGZ: '',
    },
    [eEthereumNetwork.localhost]: {
      WPUNKS: "",
      BAYC: "",
      DOODLE: "",
    },
    [eEthereumNetwork.goerli]: {
      //WPUNKS: "",
      BAYC: "",
      DOODLE: '',
      AZUKI: '',
      // COOL: '',
      // MEEBITS: '',
      // MAYC: '',
      // WOW: '',
      // CLONEX: '',
      // KONGZ: '',
      // LAND: '',
    },
    [eEthereumNetwork.main]: {
      //WPUNKS: "",
      BAYC: "",
      DOODLE: "",
      AZUKI: "",
    },
  },
};

export default UnlockdConfig;