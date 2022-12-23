import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { NETWORKS_DEFAULT_GAS } from "../helper-hardhat-config";
import { getReservesConfigByPool } from "../helpers/configuration";
import { getDebtToken } from "../helpers/contracts-getters";
import {
  advanceTimeAndBlock,
  fundWithERC721,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  ProtocolErrors,
  UnlockdPools,
} from "../helpers/types";
import {
  configuration as actionsConfiguration,
  setApprovalForAll,
  setApprovalForAllWETHGateway,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import { getLoanData } from "./helpers/utils/helpers";

const chai = require("chai");
const { expect } = chai;

makeSuite("WETHGateway - Delegate", (testEnv: TestEnv) => {
  const zero = BN.from(0);
  const depositSize = parseEther("5");
  const depositSize500 = parseEther("500");
  const GAS_PRICE = NETWORKS_DEFAULT_GAS[DRE.network.name];

  before("Initializing configuration", async () => {
    // Sets BigNumber for this suite, instead of globally
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });

    actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

    calculationsConfiguration.reservesParams = <
      iUnlockdPoolAssets<IReserveParams>
    >getReservesConfigByPool(UnlockdPools.proto);
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Hacker try to delegate different onBehalf (should revert)", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      weth,
      uWETH,
      bayc,
      dataProvider,
      configurator,
      nftOracle,
      deployer,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const liquidator = users[1];
    const hacker = users[3];
    const borrowSize1 = parseEther("1");
    const borrowSize2 = parseEther("2");
    const borrowSizeAll = borrowSize1.add(borrowSize2);

    console.log("depositETH");
    await expect(
      wethGateway
        .connect(hacker.signer)
        .depositETH(depositor.address, "0", { value: depositSize })
    ).to.be.revertedWith(ProtocolErrors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST);

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
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
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    console.log("borrowETH");
    await expect(
      wethGateway
        .connect(hacker.signer)
        .borrowETH(borrowSize2, bayc.address, tokenId, borrower.address, "0")
    ).to.be.revertedWith(ProtocolErrors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST);
  });

  it("Borrower try to Borrow more ETH to different onBehalf (should revert)", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      weth,
      uWETH,
      bayc,
      dataProvider,
      configurator,
      deployer,
      nftOracle,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const hacker = users[2];
    const borrowSize1 = parseEther("1");
    const borrowSize2 = parseEther("2");
    const borrowSizeAll = borrowSize1.add(borrowSize2);

    await advanceTimeAndBlock(100);

    // Deposit with native ETH
    await waitForTx(
      await wethGateway
        .connect(depositor.signer)
        .depositETH(depositor.address, "0", { value: depositSize })
    );

    const uTokensBalance = await uWETH.balanceOf(depositor.address);
    expect(uTokensBalance, "uTokensBalance not gte depositSize").to.be.gte(
      depositSize
    );

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(
      await debtToken
        .connect(borrower.signer)
        .approveDelegation(wethGateway.address, borrowSize1)
    );

    // Start loan

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, borrower, "BAYC");

    const getLoanDebtBalance = async () => {
      const loan = await getLoanData(
        pool,
        dataProvider,
        bayc.address,
        tokenId,
        "0"
      );
      return BN.from(loan.currentAmount.toFixed(0));
    };

    const ethBalanceBefore = await borrower.signer.getBalance();

    await configurator.setLtvManagerStatus(deployer.address, true);
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
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    console.log("Borrow first ETH with NFT");
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .borrowETH(borrowSize1, bayc.address, tokenId, borrower.address, "0")
    );

    expect(
      await borrower.signer.getBalance(),
      "current eth balance shoud increase"
    ).to.be.gt(ethBalanceBefore);

    const debtBalance = await getLoanDebtBalance();
    expect(debtBalance, "debt should gte borrowSize").to.be.gte(borrowSize1);

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData2: IConfigNftAsCollateralInput = {
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
      .configureNftsAsCollateral([collData2]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    console.log(
      "Borrower try Borrow more ETH with NFT on different onBehalfOf"
    );
    await expect(
      wethGateway
        .connect(borrower.signer)
        .borrowETH(borrowSize2, bayc.address, tokenId, hacker.address, "0")
    ).to.be.revertedWith(ProtocolErrors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST);
  });

  it("Hacker try to Borrow more ETH (should revert)", async () => {
    const {
      users,
      wethGateway,
      pool,
      loan,
      weth,
      uWETH,
      bayc,
      dataProvider,
      deployer,
      configurator,
      nftOracle,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const hacker = users[2];
    const borrowSize1 = parseEther("1");
    const borrowSize2 = parseEther("2");
    const borrowSizeAll = borrowSize1.add(borrowSize2);

    await advanceTimeAndBlock(100);

    // Deposit with native ETH
    await waitForTx(
      await wethGateway
        .connect(depositor.signer)
        .depositETH(depositor.address, "0", { value: depositSize })
    );

    const uTokensBalance = await uWETH.balanceOf(depositor.address);
    expect(uTokensBalance, "uTokensBalance not gte depositSize").to.be.gte(
      depositSize
    );

    // Delegates borrowing power of WETH to WETHGateway
    const reserveData = await pool.getReserveData(weth.address);
    const debtToken = await getDebtToken(reserveData.debtTokenAddress);
    await waitForTx(
      await debtToken
        .connect(borrower.signer)
        .approveDelegation(wethGateway.address, borrowSize1)
    );

    // Start loan

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, borrower, "BAYC");

    const getLoanDebtBalance = async () => {
      const loan = await getLoanData(
        pool,
        dataProvider,
        bayc.address,
        tokenId,
        "0"
      );
      return BN.from(loan.currentAmount.toFixed(0));
    };

    const ethBalanceBefore = await borrower.signer.getBalance();

    await configurator.setLtvManagerStatus(deployer.address, true);
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
      auctionDuration: 2,
      redeemFine: 500,
      minBidFine: 2000,
    };
    await configurator
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    console.log("Borrow first ETH with NFT");
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .borrowETH(borrowSize1, bayc.address, tokenId, borrower.address, "0")
    );

    expect(
      await borrower.signer.getBalance(),
      "current eth balance shoud increase"
    ).to.be.gt(ethBalanceBefore);

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData2: IConfigNftAsCollateralInput = {
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
      .configureNftsAsCollateral([collData2]);

    await configurator.connect(deployer.signer).setTimeframe(720000);

    const debtBalance = await getLoanDebtBalance();
    expect(debtBalance, "debt should gte borrowSize").to.be.gte(borrowSize1);

    console.log("Hacker try Borrow more ETH with others NFT");
    await expect(
      wethGateway
        .connect(hacker.signer)
        .borrowETH(borrowSize2, bayc.address, tokenId, borrower.address, "0")
    ).to.be.revertedWith(ProtocolErrors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST);
  });
});
