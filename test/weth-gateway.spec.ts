import BigNumber from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { parseEther } from "ethers/lib/utils";
import DRE from "hardhat";
import { getReservesConfigByPool } from "../helpers/configuration";
import { MAX_UINT_AMOUNT } from "../helpers/constants";
import { deploySelfdestructTransferMock } from "../helpers/contracts-deployments";
import { getDebtToken } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  fundWithERC20,
  fundWithERC721,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  UnlockdPools,
} from "../helpers/types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  setApprovalForAll,
  setApprovalForAllWETHGateway,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";
import { getLoanData } from "./helpers/utils/helpers";

const chai = require("chai");
const { expect } = chai;

makeSuite("WETHGateway", (testEnv: TestEnv) => {
  let baycInitPrice: BN;

  const zero = BN.from(0);
  const depositSize = parseEther("5");
  const gasCostSize = parseEther("0.1");

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

  it("Deposit WETH via WethGateway ", async () => {
    const { users, wethGateway, uWETH, pool } = testEnv;

    const depositor = users[0];
    const user = users[1];

    // Deposit liquidity with native ETH
    await wethGateway
      .connect(depositor.signer)
      .depositETH(depositor.address, "0", { value: depositSize });

    // Deposit with native ETH
    await wethGateway
      .connect(user.signer)
      .depositETH(user.address, "0", { value: depositSize });

    const uTokensBalance = await uWETH.balanceOf(user.address);

    expect(uTokensBalance).to.be.gt(zero);
    expect(uTokensBalance).to.be.gte(depositSize);
  });

  it("Withdraw WETH - Partial", async () => {
    const { users, wethGateway, uWETH, pool, deployer } = testEnv;

    const user = users[1];
    const priorEthersBalance = await user.signer.getBalance();
    const uTokensBalance = await uWETH.balanceOf(user.address);

    expect(uTokensBalance).to.be.gt(zero, "User should have uTokens.");

    // Partially withdraw native ETH
    const partialWithdraw = await convertToCurrencyDecimals(
      deployer,
      uWETH,
      "2"
    );

    // Approve the uTokens to Gateway so Gateway can withdraw and convert to Ether
    await waitForTx(
      await uWETH
        .connect(user.signer)
        .approve(wethGateway.address, MAX_UINT_AMOUNT)
    );

    // Partial Withdraw and send native Ether to user
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .withdrawETH(partialWithdraw, user.address)
    );

    const afterPartialEtherBalance = await user.signer.getBalance();
    const afterPartialUTokensBalance = await uWETH.balanceOf(user.address);

    expect(afterPartialEtherBalance).to.be.gt(
      priorEthersBalance,
      "User ETHER balance should greater than before balance"
    );
    expect(afterPartialEtherBalance).to.be.lt(
      priorEthersBalance.add(partialWithdraw),
      "User ETHER balance should less than before balance + withdraw"
    );
    expect(afterPartialUTokensBalance).to.be.equal(
      uTokensBalance.sub(partialWithdraw),
      "User uWETH balance should be substracted"
    );
  });

  it("Withdraw WETH - Full", async () => {
    const { users, uWETH, wethGateway, pool } = testEnv;

    const user = users[1];
    const priorEthersBalance = await user.signer.getBalance();
    const uTokensBalance = await uWETH.balanceOf(user.address);

    expect(uTokensBalance).to.be.gt(zero, "User should have uTokens.");

    // Approve the uTokens to Gateway so Gateway can withdraw and convert to Ether
    await waitForTx(
      await uWETH
        .connect(user.signer)
        .approve(wethGateway.address, MAX_UINT_AMOUNT)
    );

    // Full withdraw
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .withdrawETH(MAX_UINT_AMOUNT, user.address)
    );

    const afterFullEtherBalance = await user.signer.getBalance();
    const afterFullUTokensBalance = await uWETH.balanceOf(user.address);

    expect(afterFullEtherBalance).to.be.gt(
      priorEthersBalance,
      "User ETHER balance should greater than before balance"
    );
    expect(afterFullEtherBalance).to.be.lt(
      priorEthersBalance.add(uTokensBalance),
      "User ETHER balance should less than before balance + withdraw"
    );
    expect(afterFullUTokensBalance).to.be.eq(
      0,
      "User uWETH balance should be zero"
    );
  });

  it("Borrow WETH and Full Repay with ETH", async () => {
    const {
      users,
      wethGateway,
      pool,
      weth,
      uWETH,
      bayc,
      dataProvider,
      configurator,
      deployer,
      nftOracle,
    } = testEnv;
    const depositor = users[0];
    const user = users[1];
    const borrowSize = parseEther("1");
    const repaySize = borrowSize.add(borrowSize.mul(5).div(100));

    // Deposit with native ETH
    await waitForTx(
      await wethGateway
        .connect(depositor.signer)
        .depositETH(depositor.address, "0", { value: depositSize })
    );

    const uTokensBalance = await uWETH.balanceOf(depositor.address);
    expect(uTokensBalance).to.be.gte(depositSize);

    await advanceTimeAndBlock(100);

    // Start loan

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user.address, tokenIdNum);
    await setApprovalForAll(testEnv, user, "BAYC");

    const getDebtBalance = async () => {
      const loan = await getLoanData(
        pool,
        dataProvider,
        bayc.address,
        tokenId,
        "0"
      );

      return BN.from(loan.currentAmount.toFixed(0));
    };

    const price = await convertToCurrencyDecimals(deployer, weth, "5");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

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

    await configurator.setTimeframe(3600);

    // Borrow with NFT
    await borrow(
      testEnv,
      user,
      "WETH",
      "1",
      "BAYC",
      tokenId,
      user.address,
      "365",
      "success",
      ""
    );

    const debtBalance = await getDebtBalance();
    expect(debtBalance).to.be.gte(borrowSize);

    await advanceTimeAndBlock(100);

    // Repay with antive ETH
    // Partial Repay WETH loan with native ETH
    const partialPayment = repaySize.div(2);
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .repayETH(bayc.address, tokenId, partialPayment, {
          value: partialPayment,
        })
    );
    expect(await getDebtBalance()).to.be.lt(debtBalance);

    await advanceTimeAndBlock(100);

    // Full Repay WETH loan with native ETH
    await waitForTx(
      await wethGateway
        .connect(user.signer)
        .repayETH(bayc.address, tokenId, MAX_UINT_AMOUNT, {
          value: repaySize,
        })
    );
    expect(await getDebtBalance()).to.be.eq(zero);

    const tokenOwner = await bayc.ownerOf(tokenId);
    expect(tokenOwner).to.be.equal(
      user.address,
      "Invalid token owner after repay"
    );
  });

  it("Borrow ETH and Full Repay with ETH", async () => {
    const {
      users,
      wethGateway,
      pool,
      configurator,
      nftOracle,
      deployer,
      weth,
      uWETH,
      bayc,
      dataProvider,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const borrowSize1 = parseEther("1");
    const borrowSize2 = parseEther("2");
    const borrowSizeAll = borrowSize1.add(borrowSize2);
    const repaySize = borrowSizeAll.add(borrowSizeAll.mul(5).div(100));

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
        .approveDelegation(wethGateway.address, borrowSizeAll)
    );

    // Start loan

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");
    await setApprovalForAllWETHGateway(testEnv, borrower, "BAYC");

    await advanceTimeAndBlock(100);

    const getDebtBalance = async () => {
      const loan = await getLoanData(
        pool,
        dataProvider,
        bayc.address,
        tokenId,
        "0"
      );

      return BN.from(loan.currentAmount.toFixed(0));
    };

    const price = repaySize.mul(5);
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

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

    await configurator.setTimeframe(3600);

    const ethBalanceBefore = await borrower.signer.getBalance();

    console.log("Borrow first ETH with NFT");
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .borrowETH(borrowSize1, bayc.address, tokenId, borrower.address, "0")
    );

    await advanceTimeAndBlock(100);

    console.log("Borrow more ETH with NFT");
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .borrowETH(borrowSize2, bayc.address, tokenId, borrower.address, "0")
    );

    expect(
      await borrower.signer.getBalance(),
      "current eth balance shoud increase"
    ).to.be.gt(ethBalanceBefore);

    const debtBalance = await getDebtBalance();
    expect(debtBalance, "debt should gte borrowSize").to.be.gte(borrowSizeAll);

    await advanceTimeAndBlock(100);

    // Repay with antive ETH
    console.log("Partial Repay ETH loan with native ETH");
    const partialPayment = repaySize.div(2);
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .repayETH(bayc.address, tokenId, partialPayment, {
          value: partialPayment,
        })
    );
    expect(await getDebtBalance()).to.be.lt(debtBalance);

    await advanceTimeAndBlock(100);

    console.log("Full Repay ETH loan with native ETH");
    await waitForTx(
      await wethGateway
        .connect(borrower.signer)
        .repayETH(bayc.address, tokenId, MAX_UINT_AMOUNT, {
          value: repaySize,
        })
    );
    expect(await getDebtBalance()).to.be.eq(zero);

    const tokenOwner = await bayc.ownerOf(tokenId);
    expect(tokenOwner).to.be.equal(
      borrower.address,
      "Invalid token owner after repay"
    );
  });

  it("Should revert if receiver function receives Ether if not WETH", async () => {
    const { users, wethGateway } = testEnv;
    const user = users[0];
    const amount = parseEther("1");

    // Call receiver function (empty data + value)
    await expect(
      user.signer.sendTransaction({
        to: wethGateway.address,
        value: amount,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith("Receive not allowed");
  });

  it("Should revert if fallback functions is called with Ether", async () => {
    const { users, wethGateway } = testEnv;
    const user = users[0];
    const amount = parseEther("1");
    const fakeABI = ["function wantToCallFallback()"];
    const abiCoder = new DRE.ethers.utils.Interface(fakeABI);
    const fakeMethodEncoded = abiCoder.encodeFunctionData(
      "wantToCallFallback",
      []
    );

    // Call fallback function with value
    await expect(
      user.signer.sendTransaction({
        to: wethGateway.address,
        data: fakeMethodEncoded,
        value: amount,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith("Fallback not allowed");
  });

  it("Should revert if fallback functions is called", async () => {
    const { users, wethGateway } = testEnv;
    const user = users[0];

    const fakeABI = ["function wantToCallFallback()"];
    const abiCoder = new DRE.ethers.utils.Interface(fakeABI);
    const fakeMethodEncoded = abiCoder.encodeFunctionData(
      "wantToCallFallback",
      []
    );

    // Call fallback function without value
    await expect(
      user.signer.sendTransaction({
        to: wethGateway.address,
        data: fakeMethodEncoded,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith("Fallback not allowed");
  });

  it("Owner can do emergency ERC20 recovery", async () => {
    const { users, dai, wethGateway, deployer } = testEnv;
    const user = users[0];
    const amount = parseEther("100");

    await fundWithERC20("DAI", user.address, "100");
    await approveERC20(testEnv, user, "DAI");
    const daiBalanceAfterMint = await dai.balanceOf(user.address);

    await dai.connect(user.signer).transfer(wethGateway.address, amount);
    const daiBalanceAfterBadTransfer = await dai.balanceOf(user.address);
    expect(daiBalanceAfterBadTransfer).to.be.eq(
      daiBalanceAfterMint.sub(amount),
      "User should have lost the funds here."
    );

    await wethGateway
      .connect(deployer.signer)
      .emergencyERC20Transfer(dai.address, user.address, amount);
    const daiBalanceAfterRecovery = await dai.balanceOf(user.address);

    expect(daiBalanceAfterRecovery).to.be.eq(
      daiBalanceAfterMint,
      "User should recover the funds due emergency transfer"
    );
  });

  it("Owner can do emergency ERC721 recovery", async () => {
    const { users, bayc, wethGateway, deployer } = testEnv;
    const user = users[0];

    const tokenId = testEnv.tokenIdTracker++;

    await fundWithERC721("BAYC", user.address, tokenId);
    await setApprovalForAll(testEnv, user, "BAYC");

    await bayc
      .connect(user.signer)
      ["safeTransferFrom(address,address,uint256)"](
        user.address,
        wethGateway.address,
        tokenId
      );
    const tokenOwnerAfterBadTransfer = await bayc.ownerOf(tokenId);
    expect(tokenOwnerAfterBadTransfer).to.be.eq(
      wethGateway.address,
      "User should have lost the token here."
    );

    await wethGateway
      .connect(deployer.signer)
      .emergencyERC721Transfer(bayc.address, user.address, tokenId);
    const tokenOwnerAfterRecovery = await bayc.ownerOf(tokenId);

    expect(tokenOwnerAfterRecovery).to.be.eq(
      user.address,
      "User should recover the token due emergency transfer"
    );
  });

  it("Owner can do emergency native ETH recovery", async () => {
    const { users, wethGateway, deployer } = testEnv;
    const user = users[0];
    const amount = parseEther("1");
    const userBalancePriorCall = await user.signer.getBalance();

    // Deploy contract with payable selfdestruct contract
    const selfdestructContract = await deploySelfdestructTransferMock();

    // Selfdestruct the mock, pointing to WETHGateway address
    await waitForTx(
      await selfdestructContract
        .connect(user.signer)
        .destroyAndTransfer(wethGateway.address, { value: amount })
    );
    const userBalanceAfterCall = await user.signer.getBalance();

    expect(userBalanceAfterCall).to.be.lt(userBalancePriorCall.sub(amount), "");
    ("User should have lost the funds, less than before balance + amount");

    // Recover the funds from the contract and sends back to the user
    await wethGateway
      .connect(deployer.signer)
      .emergencyEtherTransfer(user.address, amount);

    const userBalanceAfterRecovery = await user.signer.getBalance();
    const wethGatewayAfterRecovery = await DRE.ethers.provider.getBalance(
      wethGateway.address
    );

    expect(userBalanceAfterRecovery).to.be.gt(
      0,
      "User should recover the funds due emergency eth transfer, greater than 0."
    );
    expect(userBalanceAfterRecovery).to.be.lt(
      userBalancePriorCall,
      "User should recover the funds due emergency eth transfer, less than before blance."
    );
    expect(wethGatewayAfterRecovery).to.be.eq(
      "0",
      "WETHGateway ether balance should be zero."
    );
  });
});
