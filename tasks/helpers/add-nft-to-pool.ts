import { BigNumberish } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { ADDRESS_ID_WETH_GATEWAY } from "../../helpers/constants";
import {
  getIErc721Detailed,
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
  getNFTOracle,
  getUNFTRegistryProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { getEthersSignerByAddress } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import {
  eNetwork,
  IConfigNftAsCollateralInput,
  INftParams,
} from "../../helpers/types";
import { strategyNftParams } from "../../markets/unlockd/nftsConfigs";

task("add-nft-to-pool", "Add and config new nft asset to lend pool")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("asset", "Address of underlying nft asset contract")
  .addParam("tokenId", "The tokenId of the underlying asset")
  .addOptionalParam(
    "strategy",
    "Name of nft strategy, supported: ClassA, ClassB, ClassC, ClassD, ClassE"
  )
  .setAction(async ({ pool, asset, tokenId, strategy }, DRE) => {
    await DRE.run("set-DRE");

    const network = DRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);

    const addressesProvider = await getLendPoolAddressesProvider();

    const poolAdminSigner = await getEthersSignerByAddress(
      await addressesProvider.getPoolAdmin()
    );

    const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );

    const unftRegistryProxyAddress = await addressesProvider.getUNFTRegistry();
    const unftRegistry = await getUNFTRegistryProxy(unftRegistryProxyAddress);
    const { uNftProxy } = await unftRegistry.getUNFTAddresses(asset);
    if (uNftProxy == undefined || !notFalsyOrZeroAddress(uNftProxy)) {
      throw new Error("The UNFT of asset is not created");
    }

    const wethGateway = await getWETHGateway(
      await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY)
    );

    const nftContract = await getIErc721Detailed(asset);
    const nftSymbol = await nftContract.symbol();
    console.log("NFT:", nftSymbol);

    let nftParam: INftParams;
    if (strategy != undefined && strategy != "") {
      nftParam = strategyNftParams[strategy];
    } else {
      nftParam = poolConfig.NftsConfig[nftSymbol];
    }
    if (nftParam == undefined) {
      throw new Error("The strategy of asset is not exist");
    }

    console.log("NFT Strategy:", nftParam);

    console.log("Initialize nft to lend pool");
    const initInputParams: {
      underlyingAsset: string;
    }[] = [
      {
        underlyingAsset: asset,
      },
    ];
    await waitForTx(
      await lendPoolConfiguratorProxy
        .connect(poolAdminSigner)
        .batchInitNft(initInputParams)
    );
    const nftOracleProxyAddress = await addressesProvider.getNFTOracle();
    const nftOracle = await getNFTOracle(unftRegistryProxyAddress);
    nftOracle.setPriceManagerStatus(lendPoolConfiguratorProxy.address, true);
    console.log("Configure nft parameters to lend pool");
    const collData: IConfigNftAsCollateralInput = {
      asset: asset,
      nftTokenId: tokenId,
      newPrice: parseEther("10"),
      ltv: parseInt(nftParam.baseLTVAsCollateral),
      liquidationThreshold: parseInt(nftParam.liquidationThreshold),
      redeemThreshold: parseInt(nftParam.redeemThreshold),
      liquidationBonus: parseInt(nftParam.liquidationBonus),
      redeemDuration: parseInt(nftParam.redeemDuration),
      auctionDuration: parseInt(nftParam.auctionDuration),
      redeemFine: parseInt(nftParam.redeemFine),
      minBidFine: parseInt(nftParam.minBidFine),
    };
    await lendPoolConfiguratorProxy
      .connect(poolAdminSigner)
      .configureNftsAsCollateral([collData]);
    await waitForTx(
      await lendPoolConfiguratorProxy
        .connect(poolAdminSigner)
        .configureNftsAsCollateral([collData])
    );

    const cfgInputParams: {
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
    }[] = [
      {
        asset: asset,
        tokenId: nftParam.tokenId,
        baseLTV: nftParam.baseLTVAsCollateral,
        liquidationThreshold: nftParam.liquidationThreshold,
        liquidationBonus: nftParam.liquidationBonus,
        redeemDuration: nftParam.redeemDuration,
        auctionDuration: nftParam.auctionDuration,
        redeemFine: nftParam.redeemFine,
        redeemThreshold: nftParam.redeemThreshold,
        minBidFine: nftParam.minBidFine,
        maxSupply: nftParam.maxSupply,
        maxTokenId: nftParam.maxTokenId,
      },
    ];
    await waitForTx(
      await lendPoolConfiguratorProxy
        .connect(poolAdminSigner)
        .batchConfigNft(cfgInputParams)
    );

    console.log("WETHGateway authorizeLendPoolNFT");
    await waitForTx(await wethGateway.authorizeLendPoolNFT([asset]));

    console.log("OK");
  });
