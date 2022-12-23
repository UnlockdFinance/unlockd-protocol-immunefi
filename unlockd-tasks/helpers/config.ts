import dotenv from "dotenv";
import { ethers, providers, Wallet } from "ethers";
dotenv.config();

export const getMnemonicWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(
    process.env.RPC_ENDPOINT
  );
  const mnemonic = process.env.MNEMONIC as string;
  return ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
};

export const getMnemonicEmergencyWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(
    process.env.RPC_ENDPOINT
  );
  const mnemonic = process.env.MNEMONIC as string;
  const path = "m/44'/60'/0'/0/1";
  return ethers.Wallet.fromMnemonic(mnemonic, path).connect(provider);
};

export const getOwnerWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(
    process.env.RPC_ENDPOINT
  );
  return new Wallet(process.env.PRIVATE_KEY as string, provider);
};

export const getUserWallet = async (): Promise<Wallet> => {
  const provider = await new providers.JsonRpcProvider(
    process.env.RPC_ENDPOINT
  );
  return new Wallet(process.env.PRIVATE_KEY_USER as string, provider);
};
