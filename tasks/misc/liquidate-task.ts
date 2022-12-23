import BigNumber from "bignumber.js";
import { task } from "hardhat/config";
import {
  ConfigNames,
  getCryptoPunksMarketAddress,
  getWrappedPunkTokenAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import {
  getDeploySigner,
  getLendPool,
  getLendPoolAddressesProvider,
  getMintableERC20,
  getPunkGateway,
  getUnlockdProtocolDataProvider,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  getContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork } from "../../helpers/types";
import { SignerWithAddress } from "../../test/helpers/make-suite";

// LendPool liquidate tasks
task("dev:pool-auction", "Doing WETH auction task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());
    const dataProvider = await getUnlockdProtocolDataProvider(
      await addressesProvider.getUnlockdDataProvider()
    );

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    const reserveContract = await getMintableERC20(loanData.reserveAsset);

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      reserveContract,
      amount
    );

    await waitForTx(
      await lendPool.auction(
        token,
        id,
        amountDecimals,
        signerWithAddress.address
      )
    );

    console.log("OK");
  });

task("dev:pool-redeem", "Doing WETH redeem task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to redeem, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());
    const dataProvider = await getUnlockdProtocolDataProvider(
      await addressesProvider.getUnlockdDataProvider()
    );

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    const reserveContract = await getMintableERC20(loanData.reserveAsset);

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      reserveContract,
      amount
    );

    const auctionData = await lendPool.getNftAuctionData(token, id);

    await waitForTx(
      await lendPool.redeem(token, id, amountDecimals, auctionData.bidFine)
    );

    console.log("OK");
  });

task("dev:pool-liquidate", "Doing WETH liquidate task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    await waitForTx(await lendPool.liquidate(token, id, 0));

    console.log("OK");
  });

task("dev:pool-liquidate-nftx", "Doing WETH liquidate NFTX task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    await waitForTx(await lendPool.liquidateNFTX(token, id));

    console.log("OK");
  });

// WETHGateway liquidate tasks
task("dev:weth-auction", "Doing WETH auction task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const wethGateway = await getWETHGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      weth,
      amount
    );

    await waitForTx(
      await wethGateway.auctionETH(token, id, signerWithAddress.address, {
        value: amountDecimals,
      })
    );

    console.log("OK");
  });

task("dev:weth-redeem", "Doing WETH redeem task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, token, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    const wethGateway = await getWETHGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      weth,
      amount
    );

    const auctionData = await lendPool.getNftAuctionData(token, id);

    const sendValue = amountDecimals.add(auctionData.bidFine);

    await waitForTx(
      await wethGateway.redeemETH(
        token,
        id,
        amountDecimals,
        auctionData.bidFine,
        { value: sendValue }
      )
    );

    console.log("OK");
  });

task("dev:weth-liquidate", "Doing WETH liquidate task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();
    const dataProvider = await getUnlockdProtocolDataProvider(
      await addressesProvider.getUnlockdDataProvider()
    );
    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    let extraAmount = new BigNumber(0);
    if (loanData.currentAmount.gt(loanData.bidPrice)) {
      extraAmount = new BigNumber(
        loanData.currentAmount.sub(loanData.bidPrice).toString()
      ).multipliedBy(1.1);
    }
    console.log(
      "currentAmount:",
      loanData.currentAmount.toString(),
      "bidPrice:",
      loanData.bidPrice.toString(),
      "extraAmount:",
      extraAmount.toFixed(0)
    );

    const wethGateway = await getWETHGateway();

    await waitForTx(
      await wethGateway.liquidateETH(token, id, {
        value: extraAmount.toFixed(0),
      })
    );

    console.log("OK");
  });

task("dev:weth-liquidate-nftx", "Doing WETH liquidate NFTX task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("token", "Address of ERC721")
  .addParam("id", "Token ID of ERC721")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const addressesProvider = await getLendPoolAddressesProvider();
    const dataProvider = await getUnlockdProtocolDataProvider(
      await addressesProvider.getUnlockdDataProvider()
    );
    const loanData = await dataProvider.getLoanDataByCollateral(token, id);
    console.log("currentAmount:", loanData.currentAmount.toString());

    const wethGateway = await getWETHGateway();

    await waitForTx(await wethGateway.liquidateNFTX(token, id));

    console.log("OK");
  });

// PunkGateway liquidate with ETH tasks
task("dev:punk-auction-eth", "Doing CryptoPunks auction ETH task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("id", "Token ID of CryptoPunks")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const punkGateway = await getPunkGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      weth,
      amount
    );

    await waitForTx(
      await punkGateway.auctionETH(id, signerWithAddress.address, {
        value: amountDecimals,
      })
    );

    console.log("OK");
  });

task("dev:punk-redeem-eth", "Doing CryptoPunks redeem ETH task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("id", "Token ID of CryptoPunks")
  .addParam("amount", "Amount to auction, like 0.01")
  .setAction(async ({ pool, id, amount }, DRE) => {
    await DRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPool = await getLendPool(await addressesProvider.getLendPool());

    const punksAddress = await getCryptoPunksMarketAddress(poolConfig);
    const wpunksAddress = await getWrappedPunkTokenAddress(
      poolConfig,
      punksAddress
    );

    const punkGateway = await getPunkGateway();

    const wethAddress = await getContractAddressInDb("WETH");
    const weth = await getMintableERC20(wethAddress);

    const signer = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await signer.getAddress(),
      signer: signer,
    };

    const amountDecimals = await convertToCurrencyDecimals(
      signerWithAddress,
      weth,
      amount
    );

    const auctionData = await lendPool.getNftAuctionData(wpunksAddress, id);

    const sendValue = amountDecimals.add(auctionData.bidFine);

    await waitForTx(
      await punkGateway.redeemETH(id, amountDecimals, auctionData.bidFine, {
        value: sendValue,
      })
    );

    console.log("OK");
  });

task("dev:punk-liquidate-eth", "Doing CryptoPunks liquidate ETH task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("id", "Token ID of CryptoPunks")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const punkGateway = await getPunkGateway();

    await waitForTx(await punkGateway.liquidateETH(id));

    console.log("OK");
  });

task("dev:punk-liquidate-nftx", "Doing CryptoPunks liquidate NFTX task")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("id", "Token ID of CryptoPunks")
  .setAction(async ({ pool, token, id }, DRE) => {
    await DRE.run("set-DRE");

    const punkGateway = await getPunkGateway();

    await waitForTx(await punkGateway.liquidateNFTX(id));

    console.log("OK");
  });
