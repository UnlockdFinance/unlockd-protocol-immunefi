import { task } from "hardhat/config";
import { getOwnerWallet } from "../helpers/config";
import { Functions } from "../helpers/protocolFunctions";

task("provider:getAddress", "Returns the address for the given Id")
  .addParam("bytesaddress", "The new Market Id string/name")
  .setAction(async ({ bytesaddress }) => {
    const wallet = await getOwnerWallet();
    console.log(wallet);
    console.log(bytesaddress);
    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getAddress(
      wallet,
      bytesaddress
    );
    console.log(tx);
  });
task("provider:setAddress", "User sets a new address Id ")
  .addParam("id", "The new Market Id string/name")
  .addParam("newaddress", "The new address")
  .setAction(async ({ id, newaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setAddress(
      wallet,
      id,
      newaddress
    );
    console.log(tx);
  });
task("provider:getMarketId", "User gets the market id").setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getMarketId(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setMarketId", "User sets a new Market Id name")
  .addParam("marketId", "The new Market Id string/name")
  .setAction(async ({ marketId }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setMarketId(
      wallet,
      marketId
    );
    console.log(tx);
  });

task("provider:getLendPool", "User gets the LendPool address").setAction(
  async () => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPool(wallet);
    console.log(JSON.stringify(tx));
  }
);

task("provider:setLendPoolImpl", "User sets a lendpool address")
  .addParam("provideraddress", "The new LendPool Address")
  .addParam("encodeddata", "The data to initialize the lendPool")
  .setAction(async ({ provideraddress, encodeddata }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolImpl(
      wallet,
      provideraddress,
      encodeddata
    );
    console.log(tx);
  });

task(
  "provider:getLendPoolConfigurator",
  "User gets the LendPoolConfigurator address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPoolConfigurator(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task(
  "provider:setLendPoolConfiguratorImpl",
  "User sets a lendPoolConfigurator address"
)
  .addParam("provideraddress", "The new LendPoolConfigurator Address")
  .setAction(async ({ provideraddress }) => {
    const wallet = await getOwnerWallet();

    const tx =
      await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolConfiguratorImpl(
        wallet,
        provideraddress
      );
    console.log(tx);
  });

task(
  "provider:getLtvManager",
  "User gets the Loan to Value Manager Address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLtvManager(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setLtvManager", "User sets a new Loan to Value Manager Address")
  .addParam("ltvaddress", "The new Loan to Value Manager Address")
  .setAction(async ({ ltvaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLtvManager(
      wallet,
      ltvaddress
    );
    console.log(tx);
  });

task(
  "provider:getLendPoolLiquidator",
  "User gets the lendPoolLiquidator Address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPoolLiquidator(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task(
  "provider:setLendPoolLiquidator",
  "User sets a new LendPoolLiquidator address"
)
  .addParam("lendpoolliquidatoraddress", "The new LendPoolLiquidator Address")
  .setAction(async ({ lendpoolliquidatoraddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolLiquidator(
      wallet,
      lendpoolliquidatoraddress
    );
    console.log(tx);
  });

task("provider:getPoolAdmin", "User gets the lendpool admin Address").setAction(
  async () => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.getPoolAdmin(wallet);
    console.log(JSON.stringify(tx));
  }
);

task("provider:setPoolAdmin", "User sets a lendpool admin address")
  .addParam("admin", "The new pool admin address")
  .setAction(async ({ admin }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setPoolAdmin(
      wallet,
      admin
    );
    console.log(tx);
  });

task(
  "provider:getEmergencyAdmin",
  "User gets the lendpool emergency admin Address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getEmergencyAdmin(wallet);
  console.log(JSON.stringify(tx));
});

task(
  "provider:setEmergencyAdmin",
  "User sets a lendpool emergency admin address"
)
  .addParam("emergencyadmin", "The new emergency admin address")
  .setAction(async ({ emergencyadmin }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setEmergencyAdmin(
      wallet,
      emergencyadmin
    );
    console.log(tx);
  });

task(
  "provider:getReserveOracle",
  "User gets the address of the reserve oracle"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getReserveOracle(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setReserveOracle", "User sets the address of the reserve oracle")
  .addParam("reserveoracle", "The new reserve oracle address")
  .setAction(async ({ reserveoracle }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setReserveOracle(
      wallet,
      reserveoracle
    );
    console.log(tx);
  });

task(
  "provider:getNFTOracle",
  "User gets the address of the NFT oracle"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getNFTOracle(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setNFTOracle", "User sets the address of the NFT oracle")
  .addParam("nftoracle", "The new NFT Oracle address")
  .setAction(async ({ nftoracle }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setNFTOracle(
      wallet,
      nftoracle
    );
    console.log(tx);
  });

task(
  "provider:getLendPoolLoan",
  "User gets the LendPoolLoan address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getLendPoolLoan(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setLendPoolLoanImpl", "User sets a lendPoolLoan address")
  .addParam("loanaddress", "The new LendPoolLoan Address")
  .setAction(async ({ loanaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setLendPoolLoanImpl(
      wallet,
      loanaddress
    );
    console.log(tx);
  });

task(
  "provider:getUNFTRegistry",
  "User gets the address of the UNFT registry"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getUNFTRegistry(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setUNFTRegistry", "User sets the address of the UNFT registry")
  .addParam("factory", "The new UNFT registry address")
  .setAction(async ({ factory }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setUNFTRegistry(
      wallet,
      factory
    );
    console.log(tx);
  });

task(
  "provider:getIncentivesController",
  "User gets the address of the incentives controller"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getIncentivesController(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task(
  "provider:setIncentivesController",
  "User sets the address of the incentives controller"
)
  .addParam("controller", "The new incentives controller address")
  .setAction(async ({ controller }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setIncentivesController(
      wallet,
      controller
    );
    console.log(tx);
  });

task(
  "provider:getUIDataProvider",
  "User gets the address of the UI Data Provider"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getUIDataProvider(wallet);
  console.log(JSON.stringify(tx));
});

task(
  "provider:setUIDataProvider",
  "User sets the address of the UI Data Provider"
)
  .addParam("provider", "The new UI Data Provider address")
  .setAction(async ({ provider }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setUIDataProvider(
      wallet,
      provider
    );
    console.log(tx);
  });

task(
  "provider:getUnlockdDataProvider",
  "User gets the address of the Unlockd Data Provider"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getUnlockdDataProvider(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task(
  "provider:setUnlockdDataProvider",
  "User sets the address of the Unlockd Data Provider"
)
  .addParam("provider", "The new Data Provider address")
  .setAction(async ({ provider }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setUnlockdDataProvider(
      wallet,
      provider
    );
    console.log(tx);
  });

task(
  "provider:getWalletBalanceProvider",
  "User gets the address of the Wallet Balance Provider"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getWalletBalanceProvider(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task(
  "provider:setWalletBalanceProvider",
  "User sets the address of the Wallet Balance Provider"
)
  .addParam("provider", "The new Wallet Balance Provider address")
  .setAction(async ({ provider }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setWalletBalanceProvider(
      wallet,
      provider
    );
    console.log(tx);
  });

task(
  "provider:getNFTXVaultFactory",
  "User gets the NFTXVaultFactory Address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getNFTXVaultFactory(
    wallet
  );
  console.log(JSON.stringify(tx));
});

task("provider:setNFTXVaultFactory", "User sets a new NFTXVaultFactory address")
  .addParam("nftxvaultaddress", "The NFTXVaultFactory Address")
  .setAction(async ({ nftxvaultaddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setNFTXVaultFactory(
      wallet,
      nftxvaultaddress
    );
    console.log(tx);
  });

task(
  "provider:getSushiSwapRouter",
  "User gets the Sushiswap router Address"
).setAction(async () => {
  const wallet = await getOwnerWallet();

  const tx = await Functions.LENDPOOLADDRESSPROVIDER.getSushiSwapRouter(wallet);
  console.log(JSON.stringify(tx));
});

task("provider:setSushiSwapRouter", "User sets a new Sushiswap router address")
  .addParam("sushiswaprouteraddress", "The Sushiswap router Address")
  .setAction(async ({ sushiswaprouteraddress }) => {
    const wallet = await getOwnerWallet();

    const tx = await Functions.LENDPOOLADDRESSPROVIDER.setSushiSwapRouter(
      wallet,
      sushiswaprouteraddress
    );
    console.log(tx);
  });
