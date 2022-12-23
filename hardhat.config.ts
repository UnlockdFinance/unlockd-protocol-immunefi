import path from "path";
import fs from "fs";
import { HardhatUserConfig } from "hardhat/types";
import { accounts } from "./test-wallets.js";
import { eEthereumNetwork, eNetwork } from "./helpers/types";
import { BUIDLEREVM_CHAINID } from "./helpers/buidler-constants";
import { buildForkConfig, NETWORKS_DEFAULT_GAS } from "./helper-hardhat-config";
import { bootstrap } from "global-agent";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-dependency-compiler";
import "solidity-coverage";

require("hardhat-storage-layout-diff");
require("dotenv").config();


if (process.env.GLOBAL_AGENT_HTTP_PROXY) {
  console.log("Enable Global Agent:", process.env.GLOBAL_AGENT_HTTP_PROXY);
  bootstrap();
}


const SKIP_LOAD = process.env.SKIP_LOAD === "true";
const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const DEFAULT_GAS_MUL = 5;
const HARDFORK = "london";
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || "";
const UNLIMITED_BYTECODE_SIZE = process.env.UNLIMITED_BYTECODE_SIZE === "true";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "";
const FORK_RPC_ENDPOINT = process.env.FORK_RPC_ENDPOINT || "";
export const FORK = process.env.FORK || "";

// Prevent to load scripts before compilation and typechain
if (!SKIP_LOAD) {
  ["misc", "migrations", "dev", "full", "fork", "verifications", "deployments", "helpers"].forEach((folder) => {
    const tasksPath = path.join(__dirname, "tasks", folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes(".ts"))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
  const tasksPath = path.join(__dirname, "unlockd-tasks", "tasks");
  console.log(tasksPath);
  fs.readdirSync(tasksPath)
    .filter((pth) => pth.includes(".ts"))
    .forEach((task) => {
      require(`${tasksPath}/${task}`);
    });
  
  require(`${path.join(__dirname, "tasks/misc")}/set-bre.ts`);
}



const getCommonNetworkConfig = (networkName: eNetwork, networkId: number) => ({
  url: FORK? FORK_RPC_ENDPOINT : RPC_ENDPOINT,
  hardfork: HARDFORK,
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  gasMultiplier: DEFAULT_GAS_MUL,
  gasPrice: NETWORKS_DEFAULT_GAS[networkName],
  chainId: networkId,
  accounts: PRIVATE_KEY
    ? [PRIVATE_KEY]
    : {
        mnemonic: MNEMONIC,
        path: MNEMONIC_PATH,
        initialIndex: 0,
        count: 20,
      },
  forking: {
    url: FORK_RPC_ENDPOINT,
  },
});

const buidlerConfig: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "istanbul",
        },
      },
    ],
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  mocha: {
    timeout: 0,
  },
  networks: {
    localhost: {
      hardfork: "london",
      url: "http://127.0.0.1:8545",
      chainId: BUIDLEREVM_CHAINID,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => secretKey),
      blockGasLimit: 30000000,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
    },
    goerli: getCommonNetworkConfig(eEthereumNetwork.goerli, 5),
    main: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    hardhat: {
      hardfork: "london",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      // gasPrice: NETWORKS_DEFAULT_GAS[eEthereumNetwork.hardhat],
      allowUnlimitedContractSize: UNLIMITED_BYTECODE_SIZE,
      chainId: BUIDLEREVM_CHAINID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance: balance,
      })),
      forking: buildForkConfig(),
    },
    ganache: {
      hardfork: "istanbul",
      url: "http://ganache:8545",
      accounts: {
        mnemonic: "fox sight canyon orphan hotel grow hedgehog build bless august weather swarm",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  }
};

export default buidlerConfig;