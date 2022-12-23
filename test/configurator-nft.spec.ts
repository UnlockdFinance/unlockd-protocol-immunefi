import { parseEther } from "@ethersproject/units";
import { BigNumber, BigNumberish } from "ethers";
import { MOCK_NFT_AGGREGATORS_MAXSUPPLY } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  fundWithERC20,
  fundWithERC721,
  timeLatest,
} from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput, ProtocolErrors } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";

const { expect } = require("chai");

makeSuite("Configurator-NFT", (testEnv: TestEnv) => {
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
      asset: "",
      tokenId: 1,
      baseLTV: 0,
      liquidationThreshold: 0,
      liquidationBonus: 0,
      redeemDuration: 0,
      auctionDuration: 0,
      redeemFine: 0,
      redeemThreshold: 0,
      minBidFine: 0,
      maxSupply: 10000,
      maxTokenId: 9999,
    },
  ];

  const {
    CALLER_NOT_POOL_ADMIN,
    LPC_INVALID_CONFIGURATION,
    LPC_NFT_LIQUIDITY_NOT_0,
    CALLER_NOT_LTV_MANAGER,
    LP_INVALID_OVERFLOW_VALUE,
  } = ProtocolErrors;

  const tokenSupply = MOCK_NFT_AGGREGATORS_MAXSUPPLY.BAYC;
  const maxSupply: number = +tokenSupply;

  it("Deactivates the BAYC NFT", async () => {
    const { configurator, bayc, dataProvider } = testEnv;
    await configurator.setActiveFlagOnNft(bayc.address, false);
    const { isActive } = await dataProvider.getNftConfigurationData(
      bayc.address
    );
    await expect(isActive).to.be.equal(false);
  });

  it("Deactivates the BAYC NFT Token", async () => {
    const { configurator, bayc, dataProvider } = testEnv;
    await configurator.setActiveFlagOnNftByTokenId(
      [bayc.address],
      ["101"],
      false
    );
    const { isActive } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );
    await expect(isActive).to.be.equal(false);
  });

  it("Rectivates the BAYC NFT", async () => {
    const { configurator, bayc, dataProvider } = testEnv;
    await configurator.setActiveFlagOnNft(bayc.address, true);

    const { isActive } = await dataProvider.getNftConfigurationData(
      bayc.address
    );
    await expect(isActive).to.be.equal(true);
  });

  it("Rectivates the BAYC NFT Token", async () => {
    const { configurator, bayc, dataProvider } = testEnv;
    await configurator.setActiveFlagOnNftByTokenId(
      [bayc.address],
      ["101"],
      true
    );

    const { isActive } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );
    await expect(isActive).to.be.equal(true);
  });

  it("Check the onlyAdmin on deactivateRNft ", async () => {
    const { configurator, users, bayc } = testEnv;
    await expect(
      configurator
        .connect(users[2].signer)
        .setActiveFlagOnNft(bayc.address, false),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the onlyAdmin on activateNft ", async () => {
    const { configurator, users, bayc } = testEnv;
    await expect(
      configurator
        .connect(users[2].signer)
        .setActiveFlagOnNft(bayc.address, true),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Freezes the BAYC NFT", async () => {
    const { configurator, bayc, dataProvider } = testEnv;

    await configurator.setFreezeFlagOnNft(bayc.address, true);
    const { isFrozen } = await dataProvider.getNftConfigurationData(
      bayc.address
    );

    await expect(isFrozen).to.be.equal(true);
  });

  it("Freezes the BAYC NFT Token", async () => {
    const { configurator, bayc, dataProvider } = testEnv;

    await configurator.setFreezeFlagOnNftByTokenId(
      [bayc.address],
      ["101"],
      true
    );
    const { isFrozen } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );

    await expect(isFrozen).to.be.equal(true);
  });

  it("Unfreezes the BAYC NFT", async () => {
    const { configurator, dataProvider, bayc } = testEnv;
    await configurator.setFreezeFlagOnNft(bayc.address, false);

    const { isFrozen } = await dataProvider.getNftConfigurationData(
      bayc.address
    );

    await expect(isFrozen).to.be.equal(false);
  });

  it("Unfreezes the BAYC NFT Token", async () => {
    const { configurator, dataProvider, bayc } = testEnv;
    await configurator.setFreezeFlagOnNftByTokenId(
      [bayc.address],
      ["101"],
      false
    );

    const { isFrozen } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      "101"
    );

    await expect(isFrozen).to.be.equal(false);
  });

  it("Check the onlyAdmin on freezeNft ", async () => {
    const { configurator, users, bayc } = testEnv;
    await expect(
      configurator
        .connect(users[2].signer)
        .setFreezeFlagOnNft(bayc.address, true),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Check the onlyAdmin on unfreezeNft ", async () => {
    const { configurator, users, bayc } = testEnv;
    await expect(
      configurator
        .connect(users[2].signer)
        .setFreezeFlagOnNft(bayc.address, false),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Deactivates the BAYC NFT as collateral", async () => {
    const { users, configurator, dataProvider, bayc, tokenId, nftOracle } =
      testEnv;
    await configurator.setLtvManagerStatus(users[0].address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    console.log("ltv set");
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: "101",
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(users[0].signer)
      .configureNftsAsCollateral([collData]);
    console.log("ocllateral set");
    const { ltv, liquidationBonus, liquidationThreshold } =
      await dataProvider.getNftConfigurationDataByTokenId(
        bayc.address,
        tokenId
      );

    await expect(ltv).to.be.equal(0);
    await expect(liquidationThreshold).to.be.equal(0);
    await expect(liquidationBonus).to.be.equal(0);
  });

  it("Activates the BAYC NFT as collateral", async () => {
    const { users, configurator, dataProvider, bayc, tokenId, nftOracle } =
      testEnv;
    await configurator.setLtvManagerStatus(users[0].address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 8000,
      liquidationThreshold: 8250,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(users[0].signer)
      .configureNftsAsCollateral([collData]);

    const { ltv, liquidationBonus, liquidationThreshold } =
      await dataProvider.getNftConfigurationDataByTokenId(
        bayc.address,
        tokenId
      );

    await expect(ltv).to.be.equal(8000);
    await expect(liquidationThreshold).to.be.equal(8250);
    await expect(liquidationBonus).to.be.equal(500);
  });

  it("Check the onlyLtvManager on configureNftAsCollateral ", async () => {
    const { configurator, users, bayc, tokenId, nftOracle } = testEnv;
    await configurator.setLtvManagerStatus(users[0].address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 1,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await expect(
      configurator
        .connect(users[2].signer)
        .configureNftsAsCollateral([collData]),
      CALLER_NOT_LTV_MANAGER
    ).to.be.revertedWith(CALLER_NOT_LTV_MANAGER);
  });

  it("Deactivates the BAYC NFT as auction", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;
    await configurator.configureNftAsAuction(bayc.address, tokenId, 0, 0, 0);
    await configurator.setNftRedeemThreshold(bayc.address, tokenId, 0);
    await configurator.setNftMinBidFine(bayc.address, tokenId, 0);

    const {
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
    } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    await expect(redeemDuration).to.be.equal(0);
    await expect(auctionDuration).to.be.equal(0);
    await expect(redeemFine).to.be.equal(0);
    await expect(redeemThreshold).to.be.equal(0);
    await expect(minBidFine).to.be.equal(0);
  });

  it("Activates the BAYC NFT as auction", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;
    await configurator.configureNftAsAuction(
      bayc.address,
      tokenId,
      "1",
      "1",
      "100"
    );
    await configurator.setNftRedeemThreshold(bayc.address, tokenId, "5000");
    await configurator.setNftMinBidFine(bayc.address, tokenId, 5000);

    const {
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
    } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    await expect(redeemDuration).to.be.equal(1);
    await expect(auctionDuration).to.be.equal(1);
    await expect(redeemFine).to.be.equal(100);
    await expect(redeemThreshold).to.be.equal(5000);
    await expect(minBidFine).to.be.equal(5000);
  });

  it("Check the onlyAdmin on configureNftAsAuction ", async () => {
    const { configurator, users, bayc, tokenId } = testEnv;
    await expect(
      configurator
        .connect(users[2].signer)
        .configureNftAsAuction(bayc.address, tokenId, "1", "1", "100"),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
    await expect(
      configurator
        .connect(users[2].signer)
        .setNftRedeemThreshold(bayc.address, tokenId, "5000"),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Batch Deactivates the BAYC NFT as collateral", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;

    cfgInputParams[0].asset = bayc.address;
    (cfgInputParams[0].tokenId = tokenId), (cfgInputParams[0].baseLTV = 0);
    cfgInputParams[0].liquidationThreshold = 0;
    cfgInputParams[0].liquidationBonus = 0;
    await configurator.batchConfigNft(cfgInputParams);

    const { ltv, liquidationBonus, liquidationThreshold, isActive, isFrozen } =
      await dataProvider.getNftConfigurationDataByTokenId(
        bayc.address,
        tokenId
      );

    await expect(isActive).to.be.equal(true);
    await expect(isFrozen).to.be.equal(false);
    await expect(ltv).to.be.equal(0);
    await expect(liquidationThreshold).to.be.equal(0);
    await expect(liquidationBonus).to.be.equal(0);
  });

  it("Batch Activates the BAYC NFT as collateral", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;

    cfgInputParams[0].asset = bayc.address;
    (cfgInputParams[0].tokenId = tokenId), (cfgInputParams[0].baseLTV = 8000);
    cfgInputParams[0].liquidationThreshold = 8250;
    cfgInputParams[0].liquidationBonus = 500;
    await configurator.batchConfigNft(cfgInputParams);

    const { ltv, liquidationBonus, liquidationThreshold, isActive, isFrozen } =
      await dataProvider.getNftConfigurationDataByTokenId(
        bayc.address,
        tokenId
      );

    await expect(isActive).to.be.equal(true);
    await expect(isFrozen).to.be.equal(false);
    await expect(ltv).to.be.equal(8000);
    await expect(liquidationThreshold).to.be.equal(8250);
    await expect(liquidationBonus).to.be.equal(500);
  });

  it("Check the onlyAdmin on batchConfigNft ", async () => {
    const { configurator, users, bayc } = testEnv;
    await expect(
      configurator.connect(users[2].signer).batchConfigNft(cfgInputParams),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Batch Deactivates the BAYC NFT as auction", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;

    cfgInputParams[0].asset = bayc.address;
    cfgInputParams[0].tokenId = tokenId;
    cfgInputParams[0].auctionDuration = 0;
    cfgInputParams[0].redeemDuration = 0;
    cfgInputParams[0].redeemFine = 0;
    cfgInputParams[0].redeemThreshold = 0;
    cfgInputParams[0].minBidFine = 0;
    await configurator.batchConfigNft(cfgInputParams);

    const {
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
    } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    await expect(redeemDuration).to.be.equal(0);
    await expect(auctionDuration).to.be.equal(0);
    await expect(redeemFine).to.be.equal(0);
    await expect(redeemThreshold).to.be.equal(0);
    await expect(minBidFine).to.be.equal(0);
  });

  it("Batch Activates the BAYC NFT as auction", async () => {
    const { configurator, dataProvider, bayc, tokenId } = testEnv;

    cfgInputParams[0].asset = bayc.address;
    cfgInputParams[0].tokenId = tokenId;
    cfgInputParams[0].auctionDuration = 1;
    cfgInputParams[0].redeemDuration = 1;
    cfgInputParams[0].redeemFine = 100;
    cfgInputParams[0].redeemThreshold = 5000;
    cfgInputParams[0].minBidFine = 2000;
    await configurator.batchConfigNft(cfgInputParams);

    const {
      redeemDuration,
      auctionDuration,
      redeemFine,
      redeemThreshold,
      minBidFine,
    } = await dataProvider.getNftConfigurationDataByTokenId(
      bayc.address,
      tokenId
    );

    await expect(redeemDuration).to.be.equal(1);
    await expect(auctionDuration).to.be.equal(1);
    await expect(redeemFine).to.be.equal(100);
    await expect(redeemThreshold).to.be.equal(5000);
    await expect(minBidFine).to.be.equal(2000);
  });

  it("Reverts when trying to disable the BAYC nft with liquidity on it", async () => {
    const { weth, bayc, pool, configurator, deployer } = testEnv;
    const userAddress = await pool.signer.getAddress();

    await fundWithERC20("WETH", deployer.address, "10");
    await approveERC20(testEnv, deployer, "WETH");

    const amountToDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "10"
    );
    await pool.deposit(weth.address, amountToDeposit, userAddress, "0");

    const tokenId = testEnv.tokenIdTracker++;

    await fundWithERC721("BAYC", deployer.address, tokenId);
    await setApprovalForAll(testEnv, deployer, "BAYC");

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
    await configurator.connect(deployer.signer).setTimeframe(360000);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);

    const amountToBorrow = await convertToCurrencyDecimals(deployer, weth, "1");
    await pool.borrow(
      weth.address,
      amountToBorrow,
      bayc.address,
      tokenId,
      userAddress,
      "0"
    );

    await expect(
      configurator.setActiveFlagOnNft(bayc.address, false),
      LPC_NFT_LIQUIDITY_NOT_0
    ).to.be.revertedWith(LPC_NFT_LIQUIDITY_NOT_0);
  });

  it("Config setMaxNumberOfNfts invalid value", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(
      configurator.setMaxNumberOfNfts(2),
      LPC_INVALID_CONFIGURATION
    ).to.be.revertedWith(LPC_INVALID_CONFIGURATION);
  });

  it("Config setMaxNumberOfNfts invalid value overflowing", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(
      configurator.setMaxNumberOfNfts(256),
      LP_INVALID_OVERFLOW_VALUE
    ).to.be.revertedWith(LP_INVALID_OVERFLOW_VALUE);
  });

  it("Check the onlyAdmin on setMaxNumberOfNfts ", async () => {
    const { configurator, users, pool } = testEnv;
    await expect(
      configurator.connect(users[2].signer).setMaxNumberOfNfts(512),
      CALLER_NOT_POOL_ADMIN
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it("Config the timeFrame for an X amount of time", async () => {
    const { configurator, pool } = testEnv;
    await configurator.setTimeframe(1800);
    await expect(await pool.getTimeframe()).to.be.equal(1800);
  });

  it("Check if the config timestamp is correct", async () => {
    const { users, configurator, pool, tokenId, bayc, dataProvider } = testEnv;
    const timestamp = await (await timeLatest()).toString();
    const timestampAux = BigNumber.from(timestamp);
    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId.toString(),
      newPrice: parseEther("100"),
      ltv: 4000,
      liquidationThreshold: 7000,
      redeemThreshold: 9000,
      liquidationBonus: 500,
      redeemDuration: 1,
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(users[0].signer)
      .configureNftsAsCollateral([collData]);
    const { configTimestamp } =
      await dataProvider.getNftConfigurationDataByTokenId(
        bayc.address,
        tokenId
      );
    await expect(configTimestamp).to.be.within(timestamp, timestampAux.add(10));
  });
});
