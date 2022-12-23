import UnlockdConfig from "../markets/unlockd";
import { CommonsConfig } from "../markets/unlockd/commons";
import { ZERO_ADDRESS } from "./constants";
import {
  deployCryptoPunksMarket,
  deployWETH9,
  deployWrappedPunk,
} from "./contracts-deployments";
import { getPunkGateway } from "./contracts-getters";
import {
  getEthersSignersAddresses,
  getParamPerNetwork,
  getParamPerPool,
} from "./contracts-helpers";
import { DRE, notFalsyOrZeroAddress } from "./misc-utils";
import {
  eNetwork,
  ICommonConfiguration,
  iMultiPoolsAssets,
  iMultiPoolsNfts,
  INftParams,
  IReserveParams,
  PoolConfiguration,
  tEthereumAddress,
  UnlockdPools,
} from "./types";

export enum ConfigNames {
  Commons = "Commons",
  Unlockd = "Unlockd",
}

export const loadPoolConfig = (configName: ConfigNames): PoolConfiguration => {
  switch (configName) {
    case ConfigNames.Unlockd:
      return UnlockdConfig;
    case ConfigNames.Commons:
      return CommonsConfig;
    default:
      throw new Error(
        `Unsupported pool configuration: ${Object.values(ConfigNames)}`
      );
  }
};
export const loadImpersonateAccount = (
  configName: ConfigNames
): PoolConfiguration => {
  switch (configName) {
    case ConfigNames.Unlockd:
      return UnlockdConfig;
    case ConfigNames.Commons:
      return CommonsConfig;
    default:
      throw new Error(
        `Unsupported pool configuration: ${Object.values(ConfigNames)}`
      );
  }
};
// ----------------
// PROTOCOL PARAMS PER POOL
// ----------------

export const getReservesConfigByPool = (
  pool: UnlockdPools
): iMultiPoolsAssets<IReserveParams> =>
  getParamPerPool<iMultiPoolsAssets<IReserveParams>>(
    {
      [UnlockdPools.proto]: {
        ...UnlockdConfig.ReservesConfig,
      },
    },
    pool
  );

export const getNftsConfigByPool = (
  pool: UnlockdPools
): iMultiPoolsNfts<INftParams> =>
  getParamPerPool<iMultiPoolsNfts<INftParams>>(
    {
      [UnlockdPools.proto]: {
        ...UnlockdConfig.NftsConfig,
      },
    },
    pool
  );

export const getProviderRegistryAddress = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  const registryAddress = getParamPerNetwork(
    config.ProviderRegistry,
    <eNetwork>currentNetwork
  );
  if (registryAddress) {
    return registryAddress;
  }
  return ZERO_ADDRESS;
};

export const getGenesisPoolAdmin = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  const targetAddress = getParamPerNetwork(
    config.PoolAdmin,
    <eNetwork>currentNetwork
  );
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.PoolAdminIndex;
  return addressList[addressIndex];
};

export const getEmergencyAdmin = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  const targetAddress = getParamPerNetwork(
    config.EmergencyAdmin,
    <eNetwork>currentNetwork
  );
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.EmergencyAdminIndex;
  return addressList[addressIndex];
};

export const getLendPoolLiquidator = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  const targetAddress = getParamPerNetwork(
    config.LendPoolLiquidator,
    <eNetwork>currentNetwork
  );
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.LendPoolLiquidatorIndex;
  return addressList[addressIndex];
};

export const getLtvManager = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  const targetAddress = getParamPerNetwork(
    config.LtvManager,
    <eNetwork>currentNetwork
  );
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.LtvManagerIndex;
  return addressList[addressIndex];
};

export const getTreasuryAddress = async (
  config: ICommonConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = DRE.network.name;
  return getParamPerNetwork(
    config.ReserveFactorTreasuryAddress,
    <eNetwork>currentNetwork
  );
};

export const getWrappedNativeTokenAddress = async (
  config: ICommonConfiguration
) => {
  const currentNetwork =
    process.env.MAINNET_FORK === "true" ? "main" : DRE.network.name;
  const wethAddress = getParamPerNetwork(
    config.WrappedNativeToken,
    <eNetwork>currentNetwork
  );
  if (wethAddress) {
    return wethAddress;
  }
  if (currentNetwork.includes("main")) {
    throw new Error("WETH not set at mainnet configuration.");
  }
  const weth = await deployWETH9();
  return weth.address;
};

export const getWrappedPunkTokenAddress = async (
  config: ICommonConfiguration,
  punk: tEthereumAddress
) => {
  const currentNetwork =
    process.env.MAINNET_FORK === "true" ? "main" : DRE.network.name;
  const wpunkAddress = getParamPerNetwork(
    config.WrappedPunkToken,
    <eNetwork>currentNetwork
  );
  if (wpunkAddress) {
    return wpunkAddress;
  }
  if (currentNetwork.includes("main")) {
    throw new Error("WPUNKS not set at mainnet configuration.");
  }
  if (!notFalsyOrZeroAddress(punk)) {
    throw new Error("PUNK not set at dev or testnet configuration.");
  }
  const wpunk = await deployWrappedPunk([punk]);
  return wpunk.address;
};

export const getCryptoPunksMarketAddress = async (
  config: ICommonConfiguration
) => {
  const currentNetwork =
    process.env.MAINNET_FORK === "true" ? "main" : DRE.network.name;
  const punkAddress = getParamPerNetwork(
    config.CryptoPunksMarket,
    <eNetwork>currentNetwork
  );

  return await (
    await getPunkGateway()
  ).address;

  if (punkAddress) {
    return punkAddress;
  }
  if (currentNetwork.includes("main")) {
    throw new Error("CryptoPunksMarket not set at mainnet configuration.");
  }
  const punk = await deployCryptoPunksMarket([]);
  return punk.address;
};
