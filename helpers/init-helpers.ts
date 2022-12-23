import { BigNumberish } from "ethers";
import { SignerWithAddress } from "../test/helpers/make-suite";
import { ConfigNames } from "./configuration";
import { deployRateStrategy } from "./contracts-deployments";
import {
  getCryptoPunksMarket,
  getDeploySigner,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getMintableERC20,
  getMintableERC721,
  getNFTXVault,
  getNFTXVaultFactory,
  getSushiSwapRouter,
  getUnlockdProtocolDataProvider,
  getWETHMocked,
  getWrappedPunk,
} from "./contracts-getters";
import {
  convertToCurrencyDecimals,
  getContractAddressWithJsonFallback,
  rawInsertContractAddressInDb,
} from "./contracts-helpers";
import { chunk, waitForTx } from "./misc-utils";
import {
  eContractid,
  iMultiPoolsAssets,
  iMultiPoolsNfts,
  INftParams,
  IReserveParams,
  tEthereumAddress,
} from "./types";

export const getUTokenExtraParams = async (
  uTokenName: string,
  tokenAddress: tEthereumAddress
) => {
  //console.log(uTokenName);
  switch (uTokenName) {
    default:
      return "0x10";
  }
};

export const initReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  uTokenNamePrefix: string,
  uTokenSymbolPrefix: string,
  debtTokenNamePrefix: string,
  debtTokenSymbolPrefix: string,
  admin: tEthereumAddress,
  treasuryAddress: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean
) => {
  const addressProvider = await getLendPoolAddressesProvider();

  // CHUNK CONFIGURATION
  const initChunks = 1;

  // Initialize variables for future reserves initialization
  const reserveSymbols: string[] = [];

  const initInputParams: {
    uTokenImpl: string;
    debtTokenImpl: string;
    underlyingAssetDecimals: BigNumberish;
    interestRateAddress: string;
    underlyingAsset: string;
    treasury: string;
    underlyingAssetName: string;
    uTokenName: string;
    uTokenSymbol: string;
    debtTokenName: string;
    debtTokenSymbol: string;
  }[] = [];

  let strategyRates: [
    string, // addresses provider
    string,
    string,
    string,
    string
  ];
  const rateStrategies: Record<string, typeof strategyRates> = {};
  const strategyAddresses: Record<string, tEthereumAddress> = {};

  const reserves = Object.entries(reservesParams);
  console.log("RESERVES: " + reserves);
  for (const [symbol, params] of reserves) {
    if (!tokenAddresses[symbol]) {
      console.log(
        `- Skipping init of ${symbol} due token address is not set at markets config`
      );
      continue;
    }
    const { strategy, uTokenImpl, reserveDecimals } = params;
    const {
      optimalUtilizationRate,
      baseVariableBorrowRate,
      variableRateSlope1,
      variableRateSlope2,
    } = strategy;
    if (!strategyAddresses[strategy.name]) {
      // Strategy does not exist, create a new one
      rateStrategies[strategy.name] = [
        addressProvider.address,
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      ];
      strategyAddresses[strategy.name] = await deployRateStrategy(
        strategy.name,
        rateStrategies[strategy.name],
        verify
      );

      // This causes the last strategy to be printed twice, once under "DefaultReserveInterestRateStrategy"
      // and once under the actual `strategyASSET` key.
      rawInsertContractAddressInDb(
        strategy.name,
        strategyAddresses[strategy.name]
      );
    }
    // Prepare input parameters
    reserveSymbols.push(symbol);
    const uTokenImplContractAddr = await getContractAddressWithJsonFallback(
      uTokenImpl,
      poolName
    );
    const debtTokenImplContractAddr = await getContractAddressWithJsonFallback(
      eContractid.DebtToken,
      poolName
    );
    const initParam = {
      uTokenImpl: uTokenImplContractAddr,
      debtTokenImpl: debtTokenImplContractAddr,
      underlyingAssetDecimals: reserveDecimals,
      interestRateAddress: strategyAddresses[strategy.name],
      underlyingAsset: tokenAddresses[symbol],
      treasury: treasuryAddress,
      underlyingAssetName: symbol,
      uTokenName: `${uTokenNamePrefix} ${symbol}`,
      uTokenSymbol: `${uTokenSymbolPrefix}${symbol}`,
      debtTokenName: `${debtTokenNamePrefix} ${symbol}`,
      debtTokenSymbol: `${debtTokenSymbolPrefix}${symbol}`,
    };
    initInputParams.push(initParam);
    //console.log("initInputParams:", symbol, uTokenImpl, initParam);
  }

  // Deploy init reserves per chunks
  const chunkedSymbols = chunk(reserveSymbols, initChunks);
  const chunkedInitInputParams = chunk(initInputParams, initChunks);

  const configurator = await getLendPoolConfiguratorProxy();

  console.log(
    `- Reserves initialization in ${chunkedInitInputParams.length} txs`
  );
  for (
    let chunkIndex = 0;
    chunkIndex < chunkedInitInputParams.length;
    chunkIndex++
  ) {
    const tx3 = await waitForTx(
      await configurator.batchInitReserve(chunkedInitInputParams[chunkIndex])
    );

    console.log(
      `  - Reserve ready for: ${chunkedSymbols[chunkIndex].join(", ")}`,
      chunkedInitInputParams[chunkIndex][0].underlyingAsset
    );
    console.log("    * gasUsed", tx3.gasUsed.toString());
  }
};

export const getUNftExtraParams = async (
  uNftName: string,
  nftAddress: tEthereumAddress
) => {
  //console.log(uNftName);
  switch (uNftName) {
    default:
      return "0x10";
  }
};

export const initNftsByHelper = async (
  nftsParams: iMultiPoolsNfts<INftParams>,
  nftAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const unftRegistry = await addressProvider.getUNFTRegistry();

  // CHUNK CONFIGURATION
  const initChunks = 1;

  // Initialize variables for future nfts initialization
  const nftSymbols: string[] = [];

  const initInputParams: {
    underlyingAsset: string;
  }[] = [];

  const nfts = Object.entries(nftsParams);

  for (const [symbol, params] of nfts) {
    if (!nftAddresses[symbol]) {
      console.log(
        `- Skipping init of ${symbol} due nft address is not set at markets config`
      );
      continue;
    }

    const initParam = {
      underlyingAsset: nftAddresses[symbol],
    };

    // Prepare input parameters
    nftSymbols.push(symbol);
    initInputParams.push(initParam);
  }

  // Deploy init nfts per chunks
  const chunkedSymbols = chunk(nftSymbols, initChunks);
  const chunkedInitInputParams = chunk(initInputParams, initChunks);
  const configurator = await getLendPoolConfiguratorProxy();

  console.log(`- NFTs initialization in ${chunkedInitInputParams.length} txs`);
  for (
    let chunkIndex = 0;
    chunkIndex < chunkedInitInputParams.length;
    chunkIndex++
  ) {
    const tx3 = await waitForTx(
      await configurator.batchInitNft(chunkedInitInputParams[chunkIndex])
    );

    console.log(
      `  - NFT ready for: ${chunkedSymbols[chunkIndex].join(", ")}`,
      chunkedInitInputParams[chunkIndex][0].underlyingAsset
    );
    console.log("    * gasUsed", tx3.gasUsed.toString());
  }
};

export const getPairsTokenAggregator = (
  allAssetsAddresses: {
    [tokenSymbol: string]: tEthereumAddress;
  },
  aggregatorsAddresses: { [tokenSymbol: string]: tEthereumAddress }
): [string[], string[]] => {
  const { ETH, WETH, ...assetsAddressesWithoutEth } = allAssetsAddresses;

  const pairs = Object.entries(assetsAddressesWithoutEth).map(
    ([tokenSymbol, tokenAddress]) => {
      if (tokenSymbol !== "WETH" && tokenSymbol !== "ETH") {
        const aggregatorAddressIndex = Object.keys(
          aggregatorsAddresses
        ).findIndex((value) => value === tokenSymbol);
        const [, aggregatorAddress] = (
          Object.entries(aggregatorsAddresses) as [string, tEthereumAddress][]
        )[aggregatorAddressIndex];
        return [tokenAddress, aggregatorAddress];
      }
    }
  ) as [string, string][];

  const mappedPairs = pairs.map(([asset]) => asset);
  const mappedAggregators = pairs.map(([, source]) => source);

  return [mappedPairs, mappedAggregators];
};

export const configureReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const configurator = await getLendPoolConfiguratorProxy();
  const tokens: string[] = [];
  const symbols: string[] = [];

  console.log("addressesProvider:", addressProvider.address);
  console.log("configuator:", configurator.address);

  const inputParams: {
    asset: string;
    reserveFactor: BigNumberish;
  }[] = [];

  const assetsParams: string[] = [];

  console.log(`- Configure Reserves`);
  for (const [
    assetSymbol,
    { reserveFactor, borrowingEnabled },
  ] of Object.entries(reservesParams) as [string, IReserveParams][]) {
    if (!tokenAddresses[assetSymbol]) {
      console.log(
        `- Skipping init of ${assetSymbol} due token address is not set at markets config`
      );
      continue;
    }

    const assetAddressIndex = Object.keys(tokenAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, tokenAddress] = (
      Object.entries(tokenAddresses) as [string, string][]
    )[assetAddressIndex];
    // Push data
    if (borrowingEnabled) {
      assetsParams.push(tokenAddress);
    }

    inputParams.push({
      asset: tokenAddress,
      reserveFactor: reserveFactor,
    });

    tokens.push(tokenAddress);
    symbols.push(assetSymbol);

    console.log(
      `  - Params for ${assetSymbol}:`,
      reserveFactor,
      borrowingEnabled
    );
  }
  if (tokens.length) {
    // Deploy init per chunks
    const enableChunks = 20;
    const chunkedSymbols = chunk(symbols, enableChunks);
    const chunkedInputParams = chunk(inputParams, enableChunks);

    console.log(`- Configure reserves in ${chunkedInputParams.length} txs`);
    for (
      let chunkIndex = 0;
      chunkIndex < chunkedInputParams.length;
      chunkIndex++
    ) {
      await waitForTx(
        await configurator.batchConfigReserve(chunkedInputParams[chunkIndex])
      );
      console.log(
        `  - batchConfigReserve for: ${chunkedSymbols[chunkIndex].join(", ")}`
      );
    }

    for (const assetParam of assetsParams) {
      await waitForTx(
        await configurator.setBorrowingFlagOnReserve(assetParam, true)
      );
    }
  }
};

export const configureNftsByHelper = async (
  nftsParams: iMultiPoolsNfts<INftParams>,
  nftAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const configuator = await getLendPoolConfiguratorProxy();
  const tokens: string[] = [];
  const symbols: string[] = [];

  console.log("addressesProvider:", addressProvider.address);
  console.log("configuator:", configuator.address);

  const inputParams: {
    asset: string;
    tokenId: BigNumberish;
    baseLTV: BigNumberish;
    liquidationThreshold: BigNumberish;
    liquidationBonus: BigNumberish;
    redeemDuration: BigNumberish;
    auctionDuration: BigNumberish;
    redeemFine: BigNumberish;
    redeemThreshold: BigNumberish;
    minBidFine: BigNumberish;
    maxSupply: BigNumberish;
    maxTokenId: BigNumberish;
  }[] = [];

  console.log(`- Configure NFTs`);
  for (const [
    assetSymbol,
    {
      tokenId,
      baseLTVAsCollateral,
      liquidationBonus,
      liquidationThreshold,
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
      maxSupply,
      maxTokenId,
    },
  ] of Object.entries(nftsParams) as [string, INftParams][]) {
    if (!nftAddresses[assetSymbol]) {
      console.log(
        `- Skipping init of ${assetSymbol} due nft address is not set at markets config`
      );
      continue;
    }
    if (baseLTVAsCollateral === "-1") continue;

    const assetAddressIndex = Object.keys(nftAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, tokenAddress] = (
      Object.entries(nftAddresses) as [string, string][]
    )[assetAddressIndex];
    // Push data

    for (let _tokenId = 100; _tokenId < 140; _tokenId++) {
      inputParams.push({
        asset: tokenAddress,
        tokenId: _tokenId,
        baseLTV: baseLTVAsCollateral,
        liquidationThreshold: liquidationThreshold,
        liquidationBonus: liquidationBonus,
        redeemDuration: redeemDuration,
        auctionDuration: auctionDuration,
        redeemFine: redeemFine,
        redeemThreshold: redeemThreshold,
        minBidFine: minBidFine,
        maxSupply: maxSupply,
        maxTokenId: maxTokenId,
      });

      tokens.push(tokenAddress);
      symbols.push(assetSymbol);
    }

    console.log(
      `  - Params for ${assetSymbol}:`,
      baseLTVAsCollateral,
      liquidationThreshold,
      liquidationBonus,
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
      maxSupply,
      maxTokenId
    );
  }
  if (tokens.length) {
    // Deploy init per chunks
    const enableChunks = 20;
    const chunkedSymbols = chunk(symbols, enableChunks);
    const chunkedInputParams = chunk(inputParams, enableChunks);

    console.log(`- Configure NFTs in ${chunkedInputParams.length} txs`);
    for (
      let chunkIndex = 0;
      chunkIndex < chunkedInputParams.length;
      chunkIndex++
    ) {
      //console.log("configureNfts:", chunkedInputParams[chunkIndex]);
      await waitForTx(
        await configuator.batchConfigNft(chunkedInputParams[chunkIndex])
      );
      console.log(
        `  - batchConfigNft for: ${chunkedSymbols[chunkIndex].join(", ")}`
      );
    }
  }
};

export const initNFTXByHelper = async () => {
  const deployer = await getDeploySigner();
  const signerWithAddress: SignerWithAddress = {
    address: await deployer.getAddress(),
    signer: deployer,
  };

  const dataProvider = await getUnlockdProtocolDataProvider();
  const allReserveTokens = await dataProvider.getAllReservesTokenDatas();
  const usdcAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "USDC"
  )?.tokenAddress;
  const wethAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "WETH"
  )?.tokenAddress;

  if (!usdcAddress || !wethAddress) {
    console.error("Invalid Reserve Tokens", usdcAddress, wethAddress);
    process.exit(1);
  }

  const usdc = await getMintableERC20(usdcAddress);
  const weth = await getWETHMocked(wethAddress);

  const allUNftTokens = await dataProvider.getAllNftsTokenDatas();

  const wpunksAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "WPUNKS"
  )?.nftAddress;
  const baycAddress = allUNftTokens.find(
    (tokenData) => tokenData.nftSymbol === "BAYC"
  )?.nftAddress;

  if (!baycAddress || !wpunksAddress) {
    console.error("Invalid NFT Tokens", baycAddress, wpunksAddress);
    process.exit(1);
  }

  const bayc = await getMintableERC721(baycAddress);

  const cryptoPunksMarket = await getCryptoPunksMarket();
  const wrappedPunk = await getWrappedPunk();
  await waitForTx(await wrappedPunk.connect(deployer).registerProxy());
  const wrappedPunkProxy = await wrappedPunk.proxyInfo(
    await deployer.getAddress()
  );

  const nftxVaultFactory = await getNFTXVaultFactory();
  const sushiSwapRouter = await getSushiSwapRouter();

  // Create NFTX Vault for bayc
  console.log("- Creating & depositing into BAYC NFTX Vault");
  await nftxVaultFactory.createVault(
    "Unlockd Mock BAYC",
    "BAYC",
    bayc.address,
    false,
    true
  );
  const vaultsForAssets = await nftxVaultFactory.vaultsForAsset(bayc.address);
  const nftxVault = await getNFTXVault(vaultsForAssets[0]);

  const baycTokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Mint BAYC tokens to owner
  for (const baycTokenId of baycTokenIds) {
    await bayc.connect(deployer).mint(baycTokenId);
  }

  // Deposit 10 BAYC tokens to vault
  await bayc.setApprovalForAll(nftxVault.address, true);
  await nftxVault.connect(deployer).mint(baycTokenIds, []);

  const nftxTokenAmount = await convertToCurrencyDecimals(
    signerWithAddress,
    bayc,
    "4"
  );

  console.log("- Configuring BAYC/USDC Pool on SushiSwap");
  // Deposit 600000 USDC to owner
  let lpUSDCAmount = await convertToCurrencyDecimals(
    signerWithAddress,
    usdc,
    "600000"
  );
  await usdc.connect(deployer).mint(lpUSDCAmount);

  // Provide liquidity to SushiSwap - Price is 15000 USDC
  await nftxVault
    .connect(deployer)
    .approve(sushiSwapRouter.address, nftxTokenAmount);
  await usdc.connect(deployer).approve(sushiSwapRouter.address, lpUSDCAmount);

  await sushiSwapRouter
    .connect(deployer)
    .addLiquidity(
      nftxVault.address,
      usdc.address,
      nftxTokenAmount,
      lpUSDCAmount,
      0,
      0,
      await deployer.getAddress(),
      new Date().getTime() + 10000
    );

  console.log("- Configuring BAYC/WETH Pool on SushiSwap");
  // Deposit 400 WETH to owner
  const lpWETHAmount = await convertToCurrencyDecimals(
    signerWithAddress,
    weth,
    "400"
  );
  await weth.connect(deployer).mint(lpWETHAmount);

  // Provide liquidity to SushiSwap - Price is 100 WETH
  await nftxVault
    .connect(deployer)
    .approve(sushiSwapRouter.address, nftxTokenAmount);
  await weth.connect(deployer).approve(sushiSwapRouter.address, lpWETHAmount);

  await sushiSwapRouter
    .connect(deployer)
    .addLiquidity(
      nftxVault.address,
      weth.address,
      nftxTokenAmount,
      lpWETHAmount,
      0,
      0,
      await deployer.getAddress(),
      new Date().getTime() + 10000
    );

  // Create NFTX Vault for WPUNKS
  console.log("- Creating & depositing into WPUNKS NFTX Vault");
  await nftxVaultFactory.createVault(
    "Unlockd Mock WPUNKS",
    "WPUNKS",
    wrappedPunk.address,
    false,
    true
  );
  const wrappedPunkVaultsForAssets = await nftxVaultFactory.vaultsForAsset(
    wrappedPunk.address
  );
  const wrappedPunkVault = await getNFTXVault(wrappedPunkVaultsForAssets[0]);

  // Mint WPUNKS tokens to owner
  const wrappedPunkTokenIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (const wrappedPunkTokenId of wrappedPunkTokenIds) {
    await waitForTx(
      await cryptoPunksMarket.connect(deployer).getPunk(wrappedPunkTokenId)
    );
    await waitForTx(
      await cryptoPunksMarket.transferPunk(wrappedPunkProxy, wrappedPunkTokenId)
    );
    await waitForTx(
      await wrappedPunk.connect(deployer).mint(wrappedPunkTokenId)
    );
  }

  // Deposit 10 WPUNKS tokens to vault
  await wrappedPunk.setApprovalForAll(wrappedPunkVault.address, true);
  await wrappedPunkVault.connect(deployer).mint(wrappedPunkTokenIds, []);

  console.log("- Configuring WPUNKS/USDC Pool on SushiSwap");
  // Deposit 600000 USDC to owner
  lpUSDCAmount = await convertToCurrencyDecimals(
    signerWithAddress,
    usdc,
    "600000"
  );
  await usdc.connect(deployer).mint(lpUSDCAmount);

  // Provide liquidity to SushiSwap - Price is 15000 USDC
  await wrappedPunkVault
    .connect(deployer)
    .approve(sushiSwapRouter.address, nftxTokenAmount);
  await usdc.connect(deployer).approve(sushiSwapRouter.address, lpUSDCAmount);

  await sushiSwapRouter
    .connect(deployer)
    .addLiquidity(
      wrappedPunkVault.address,
      usdc.address,
      nftxTokenAmount,
      lpUSDCAmount,
      0,
      0,
      await deployer.getAddress(),
      new Date().getTime() + 10000
    );

  console.log("- Configuring WPUNKS/WETH Pool on SushiSwap");
  // Deposit 400 WETH to owner
  await weth.connect(deployer).mint(lpWETHAmount);

  // Provide liquidity to SushiSwap - Price is 100 WETH
  await wrappedPunkVault
    .connect(deployer)
    .approve(sushiSwapRouter.address, nftxTokenAmount);
  await weth.connect(deployer).approve(sushiSwapRouter.address, lpWETHAmount);

  await sushiSwapRouter
    .connect(deployer)
    .addLiquidity(
      wrappedPunkVault.address,
      weth.address,
      nftxTokenAmount,
      lpWETHAmount,
      0,
      0,
      await deployer.getAddress(),
      new Date().getTime() + 10000
    );
};
