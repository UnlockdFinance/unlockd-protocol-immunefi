import BigNumber from "bignumber.js";
import { signTypedData_v4 } from "eth-sig-util";
import { ECDSASignature, fromRpcSig } from "ethereumjs-util";
import { Contract, ethers, Signer, utils } from "ethers";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "../test/helpers/make-suite";
import { MintableERC20 } from "../types/MintableERC20";
import { MintableERC721 } from "../types/MintableERC721";
import { ConfigNames, loadPoolConfig } from "./configuration";
import { ZERO_ADDRESS } from "./constants";
import { getDeploySigner } from "./contracts-getters";
import { verifyEtherscanContract } from "./etherscan-verification";
import { DRE, getDb, notFalsyOrZeroAddress, waitForTx } from "./misc-utils";
import {
  eContractid,
  eEthereumNetwork,
  eNetwork,
  iEthereumParamsPerNetwork,
  iParamsPerNetwork,
  iParamsPerPool,
  tEthereumAddress,
  tStringTokenSmallUnits,
  UnlockdPools,
} from "./types";

export type MockTokenMap = { [symbol: string]: MintableERC20 };
export type MockNftMap = { [symbol: string]: MintableERC721 };

export const registerContractInJsonDb = async (
  contractId: string,
  contractInstance: Contract
) => {
  const currentNetwork = DRE.network.name;
  const FORK = process.env.FORK;
  if (
    FORK ||
    (currentNetwork !== "hardhat" && !currentNetwork.includes("coverage"))
  ) {
    console.log(`*** ${contractId} ***\n`);
    console.log(`Network: ${currentNetwork}`);
    console.log(`tx: ${contractInstance.deployTransaction.hash}`);
    console.log(`contract address: ${contractInstance.address}`);
    console.log(`deployer address: ${contractInstance.deployTransaction.from}`);
    console.log(`gas price: ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`gas used: ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\n******`);
    console.log();
  }

  await getDb(currentNetwork)
    .set(`${contractId}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();

  console.log(
    "contracts-helpers:registerContractInJsonDb,",
    "contractId:",
    contractId,
    "address:",
    contractInstance.address,
    "deployer",
    contractInstance.deployTransaction.from
  );
};

export const insertContractAddressInDb = async (
  id: eContractid,
  address: tEthereumAddress
) => {
  console.log(
    "contracts-helpers:insertContractAddressInDb,",
    "id:",
    id,
    "address",
    address
  );
  await getDb(DRE.network.name)
    .set(`${id}`, {
      address,
    })
    .write();
};

export const rawInsertContractAddressInDb = async (
  id: string,
  address: tEthereumAddress
) => {
  console.log(
    "contracts-helpers:rawInsertContractAddressInDb,",
    "id:",
    id,
    "address",
    address
  );
  await getDb(DRE.network.name)
    .set(`${id}`, {
      address,
    })
    .write();
};

export const getContractAddressInDb = async (
  id: string
): Promise<tEthereumAddress> => {
  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  throw Error(
    `Missing contract address ${id} at Market config and JSON local db`
  );
};

export const tryGetContractAddressInDb = async (
  id: string
): Promise<tEthereumAddress> => {
  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  return ZERO_ADDRESS;
};

export const getEthersSigners = async (): Promise<Signer[]> => {
  const ethersSigners = await Promise.all(await DRE.ethers.getSigners());
  return ethersSigners;
};

export const getEthersSignerByAddress = async (
  address: string
): Promise<Signer> => {
  const ethersSigner = await DRE.ethers.getSigner(address);
  return ethersSigner;
};

export const getEthersSignersAddresses = async (): Promise<
  tEthereumAddress[]
> =>
  await Promise.all(
    (await getEthersSigners()).map((signer) => signer.getAddress())
  );

export const getCurrentBlock = async () => {
  return DRE.ethers.provider.getBlockNumber();
};

export const decodeAbiNumber = (data: string): number =>
  parseInt(utils.defaultAbiCoder.decode(["uint256"], data).toString());

export const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[]
): Promise<ContractType> => {
  console.log(
    "contracts-helpers:deployContract,",
    "contractName",
    contractName
  );
  const contract = (await (await DRE.ethers.getContractFactory(contractName))
    .connect(await getDeploySigner())
    .deploy(...args)) as ContractType;
  await waitForTx(contract.deployTransaction);
  await registerContractInJsonDb(<eContractid>contractName, contract);
  return contract;
};

export const withSaveAndVerify = async <ContractType extends Contract>(
  instance: ContractType,
  id: string,
  args: (string | string[])[],
  verify?: boolean
): Promise<ContractType> => {
  //console.log('contracts-helpers:withSaveAndVerify,','id',id)
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(id, instance);
  if (verify) {
    await verifyContract(id, instance, args);
  }
  return instance;
};

export const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> =>
  (await DRE.ethers.getContractAt(contractName, address)) as ContractType;

export const linkBytecode = (artifact: Artifact, libraries: any) => {
  let bytecode = artifact.bytecode;

  for (const [fileName, fileReferences] of Object.entries(
    artifact.linkReferences
  )) {
    for (const [libName, fixups] of Object.entries(fileReferences)) {
      const addr = libraries[libName];

      if (addr === undefined) {
        continue;
      }

      for (const fixup of fixups) {
        bytecode =
          bytecode.substr(0, 2 + fixup.start * 2) +
          addr.substr(2) +
          bytecode.substr(2 + (fixup.start + fixup.length) * 2);
      }
    }
  }

  return bytecode;
};

export const getParamPerNetwork = <T>(
  param: iParamsPerNetwork<T>,
  network: eNetwork
) => {
  const { main, goerli, hardhat, localhost } =
    param as iEthereumParamsPerNetwork<T>;

  switch (network) {
    case eEthereumNetwork.hardhat:
      return hardhat;
    case eEthereumNetwork.localhost:
      return localhost;
    case eEthereumNetwork.goerli:
      return goerli;
    case eEthereumNetwork.main:
      return main;
  }

  return hardhat;
};

export const insertParamPerNetwork = <T>(
  param: iParamsPerNetwork<T>,
  network: eNetwork
) => {
  const { main, goerli, hardhat, localhost } =
    param as iEthereumParamsPerNetwork<T>;

  switch (network) {
    case eEthereumNetwork.hardhat:
      return hardhat;
    case eEthereumNetwork.localhost:
      return localhost;
    case eEthereumNetwork.goerli:
      return goerli;
    case eEthereumNetwork.main:
      return main;
  }

  return hardhat;
};

export const getOptionalParamAddressPerNetwork = (
  param: iParamsPerNetwork<tEthereumAddress> | undefined | null,
  network: eNetwork
) => {
  if (!param) {
    return ZERO_ADDRESS;
  }
  return getParamPerNetwork(param, network);
};

export const getParamPerPool = <T>(
  { proto }: iParamsPerPool<T>,
  pool: UnlockdPools
) => {
  switch (pool) {
    case UnlockdPools.proto:
      return proto;
    default:
      return proto;
  }
};

export const convertToCurrencyDecimals = async (
  user: SignerWithAddress,
  token: Contract,
  amount: string
) => {
  const decimals = (await token.connect(user.signer).decimals()).toString();
  const tokenAmount = ethers.utils.parseUnits(amount, decimals);

  return tokenAmount;
};

export const convertToCurrencyUnits = async (
  user: SignerWithAddress,
  token: Contract,
  amount: string
) => {
  const decimals = (await token.connect(user.signer).decimals()).toString();
  const currencyUnit = new BigNumber(10).pow(decimals);
  const amountInCurrencyUnits = new BigNumber(amount).div(currencyUnit);
  return amountInCurrencyUnits.toFixed();
};

export const buildPermitParams = (
  chainId: number,
  token: tEthereumAddress,
  revision: string,
  tokenName: string,
  owner: tEthereumAddress,
  spender: tEthereumAddress,
  nonce: number,
  deadline: string,
  value: tStringTokenSmallUnits
) => ({
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "Permit" as const,
  domain: {
    name: tokenName,
    version: revision,
    chainId: chainId,
    verifyingContract: token,
  },
  message: {
    owner,
    spender,
    value,
    nonce,
    deadline,
  },
});

export const getSignatureFromTypedData = (
  privateKey: string,
  typedData: any // TODO: should be TypedData, from eth-sig-utils, but TS doesn't accept it
): ECDSASignature => {
  const signature = signTypedData_v4(
    Buffer.from(privateKey.substring(2, 66), "hex"),
    {
      data: typedData,
    }
  );
  return fromRpcSig(signature);
};

export const verifyContract = async (
  id: string,
  instance: Contract,
  args: (string | string[])[]
) => {
  if (id == eContractid.UnlockdUpgradeableProxy) {
    await verifyEtherscanContract(
      instance.address,
      args,
      "contracts/libraries/proxy/UnlockdUpgradeableProxy.sol:UnlockdUpgradeableProxy"
    );
  } else if (
    id == eContractid.UnlockdProxyAdminFund ||
    id == eContractid.UnlockdProxyAdminPool
  ) {
    await verifyEtherscanContract(
      instance.address,
      args,
      "contracts/libraries/proxy/UnlockdProxyAdmin.sol:UnlockdProxyAdmin"
    );
  } else {
    await verifyEtherscanContract(instance.address, args);
  }
  return instance;
};

export const getContractAddressWithJsonFallback = async (
  id: string,
  pool: ConfigNames
): Promise<tEthereumAddress> => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;
  const db = getDb(network);

  const contractAtMarketConfig = getOptionalParamAddressPerNetwork(
    poolConfig[id],
    network
  );
  if (notFalsyOrZeroAddress(contractAtMarketConfig)) {
    return contractAtMarketConfig;
  }

  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  throw Error(
    `Missing contract address ${id} at Market config and JSON local db`
  );
};
