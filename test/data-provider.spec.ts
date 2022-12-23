import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { ZERO_ADDRESS } from "../helpers/constants";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import { fundWithERC20, fundWithERC721 } from "../helpers/misc-utils";
import { IConfigNftAsCollateralInput } from "../helpers/types";
import { approveERC20, setApprovalForAll } from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";

const chai = require("chai");

const { expect } = chai;

makeSuite("DataProvider", (testEnv) => {
  before("set config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
  });

  after("reset config", () => {
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("Borrows WETH using 1 BAYC", async () => {
    const { users, pool, reserveOracle, weth, bayc, configurator, deployer } =
      testEnv;
    const depositor = users[0];
    const borrower = users[1];

    //Depositor mints WETH
    await fundWithERC20("WETH", depositor.address, "1000");
    //Depositor approve protocol to access depositor wallet
    await approveERC20(testEnv, depositor, "WETH");

    //Depositor deposits 1000 WETH
    const amountDeposit = await convertToCurrencyDecimals(
      deployer,
      weth,
      "1000"
    );

    await pool
      .connect(depositor.signer)
      .deposit(weth.address, amountDeposit, depositor.address, "0");

    //Borrower mints BAYC
    await fundWithERC721("BAYC", borrower.address, 101);
    await fundWithERC721("BAYC", borrower.address, 102); // for data provider test case

    //Borrower approve protocol to access borrower wallet
    await setApprovalForAll(testEnv, borrower, "BAYC");

    //Borrower borrows
    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);
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
      .connect(deployer.signer)
      .configureNftsAsCollateral([collData]);
    const loanColDataBefore = await pool.getNftCollateralData(
      bayc.address,
      "101",
      weth.address
    );

    const wethPrice = await reserveOracle.getAssetPrice(weth.address);

    const amountBorrow = await convertToCurrencyDecimals(
      deployer,
      weth,
      new BigNumber(loanColDataBefore.availableBorrowsInETH.toString())
        .div(wethPrice.toString())
        .multipliedBy(0.5)
        .toFixed(0)
    );

    await configurator
      .connect(deployer.signer)
      .setLtvManagerStatus(deployer.address, true);

    await pool
      .connect(borrower.signer)
      .triggerUserCollateral(bayc.address, "101");

    await pool
      .connect(borrower.signer)
      .borrow(
        weth.address,
        amountBorrow.toString(),
        bayc.address,
        "101",
        borrower.address,
        "0"
      );
  });

  it("Query UI Reserve Data", async () => {
    const { users, addressesProvider, weth, uiProvider } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    {
      const reservesList = await uiProvider.getReservesList(
        addressesProvider.address
      );
      expect(reservesList).to.include(weth.address);
    }

    {
      const simpleReservesData = await uiProvider.getSimpleReservesData(
        addressesProvider.address
      );
      const wethData = simpleReservesData.find((reserveData) => {
        if (reserveData.underlyingAsset === weth.address) {
          return reserveData;
        }
      });
      //console.log("simpleReservesData", simpleReservesData);
      expect(wethData?.isActive).to.be.equal(true);
      expect(wethData?.totalVariableDebt).to.be.gt(0);
    }

    {
      const userReservesData = await uiProvider.getUserReservesData(
        addressesProvider.address,
        borrower.address
      );
      const userWethData = userReservesData.find((userReserveData) => {
        if (userReserveData.underlyingAsset === weth.address) {
          return userReserveData;
        }
      });
      //console.log("userReservesData", userReservesData);
      expect(userWethData?.variableDebt).to.be.gt(0);
    }

    {
      const aggReservesData = await uiProvider.getReservesData(
        addressesProvider.address,
        borrower.address
      );
      const aggWethData = aggReservesData[0].find((reserveData) => {
        if (reserveData.underlyingAsset === weth.address) {
          return reserveData;
        }
      });
      //console.log("aggReservesData", aggReservesData);
      expect(aggWethData?.isActive).to.be.equal(true);
      expect(aggWethData?.totalVariableDebt).to.be.gt(0);
      const aggUserWethData = aggReservesData[1].find((userReserveData) => {
        if (userReserveData.underlyingAsset === weth.address) {
          return userReserveData;
        }
      });
      expect(aggUserWethData?.variableDebt).to.be.gt(0);
    }
  });

  it("Query UI NFT Data", async () => {
    const { users, addressesProvider, bayc, uiProvider } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    {
      const nftsList = await uiProvider.getNftsList(addressesProvider.address);
      expect(nftsList).to.include(bayc.address);
    }

    {
      const simpleNftsData = await uiProvider.getSimpleNftsData(
        addressesProvider.address
      );
      const baycData = simpleNftsData.find((nftData) => {
        if (nftData.underlyingAsset === bayc.address) {
          return nftData;
        }
      });
      //console.log("simpleNftsData", simpleNftsData);
      expect(baycData?.isActive).to.be.equal(true);
      expect(baycData?.totalCollateral).to.be.gt(0);
    }

    {
      const userNftsData = await uiProvider.getUserNftsData(
        addressesProvider.address,
        borrower.address
      );
      const userBaycData = userNftsData.find((userNftData) => {
        if (userNftData.underlyingAsset === bayc.address) {
          return userNftData;
        }
      });
      //console.log("userNftsData", userNftsData);
      expect(userBaycData?.totalCollateral).to.be.gt(0);
    }

    {
      const aggNftsData = await uiProvider.getNftsData(
        addressesProvider.address,
        borrower.address
      );
      const aggBaycData = aggNftsData[0].find((nftData) => {
        if (nftData.underlyingAsset === bayc.address) {
          return nftData;
        }
      });
      //console.log("aggNftsData", aggNftsData);
      expect(aggBaycData?.isActive).to.be.equal(true);
      expect(aggBaycData?.totalCollateral).to.be.gt(0);
      const aggUserBaycData = aggNftsData[1].find((userNftData) => {
        if (userNftData.underlyingAsset === bayc.address) {
          return userNftData;
        }
      });
      expect(aggUserBaycData?.totalCollateral).to.be.gt(0);
    }
  });

  it("Query UI Loan Data", async () => {
    const { users, addressesProvider, weth, bayc, uiProvider } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    {
      const simpleLoansData = await uiProvider.getSimpleLoansData(
        addressesProvider.address,
        [bayc.address, bayc.address],
        ["101", "102"]
      );
      //console.log("simpleLoansData", simpleLoansData);

      const loanData4Nft101 = simpleLoansData[0];
      const loanData4Nft102 = simpleLoansData[1];

      expect(loanData4Nft101.loanId).to.be.gt(0);
      expect(loanData4Nft101.totalCollateralInReserve).to.be.gt(0);
      expect(loanData4Nft101.availableBorrowsInReserve).to.be.gt(0);
      expect(loanData4Nft101.totalDebtInReserve).to.be.gt(0);
      expect(loanData4Nft101.reserveAsset).to.be.eq(weth.address);

      expect(loanData4Nft102.loanId).to.be.equal(0);
      expect(loanData4Nft102.totalDebtInReserve).to.be.equal(0);
      expect(loanData4Nft102.reserveAsset).to.be.eq(ZERO_ADDRESS);
    }
  });

  it("Query Wallet Reserve Data", async () => {
    const {
      users,
      addressesProvider,
      weth,
      uWETH,
      walletProvider,
      dataProvider,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    {
      const borrowerBalances = await walletProvider.getUserReservesBalances(
        addressesProvider.address,
        borrower.address
      );
      const assetIndex = borrowerBalances[0].findIndex((asset, index) => {
        if (asset === weth.address) {
          return true;
        }
      });
      expect(assetIndex).to.not.equal(undefined);
      expect(borrowerBalances[1][assetIndex]).to.be.gt(0);

      const tokenData = await dataProvider.getReserveTokenData(
        borrowerBalances[0][assetIndex]
      );
      const debtBalance = await walletProvider.balanceOfReserve(
        borrower.address,
        tokenData.debtTokenAddress
      );
      expect(debtBalance).to.be.gt(0); // NFT 101 borrow WETH
    }

    {
      const depositorBalances = await walletProvider.getUserReservesBalances(
        addressesProvider.address,
        depositor.address
      );
      const assetIndex = depositorBalances[0].findIndex((asset, index) => {
        if (asset === weth.address) {
          return true;
        }
      });
      expect(assetIndex).to.not.equal(undefined);
      expect(depositorBalances[1][assetIndex]).to.be.equal(0); // all weth has deposited

      const tokenData = await dataProvider.getReserveTokenData(
        depositorBalances[0][assetIndex]
      );
      const uTokenBalance = await walletProvider.balanceOfReserve(
        depositor.address,
        tokenData.uTokenAddress
      );
      expect(uTokenBalance).to.be.gt(0); // all weth has deposited
    }

    {
      const batchBalances = await walletProvider.batchBalanceOfReserve(
        [depositor.address, borrower.address],
        [weth.address, uWETH.address]
      );
      //depositor + weth
      expect(batchBalances[0 * 2 + 0]).to.be.equal(0); // all weth has deposited
      //depositor + uWETH
      expect(batchBalances[0 * 2 + 1]).to.be.gt(0); // all weth has deposited
      //borrower + weth
      expect(batchBalances[1 * 2 + 0]).to.be.gt(0); // NFT 101 borrow eth
      //borrower + uWETH
      expect(batchBalances[1 * 2 + 1]).to.be.equal(0); // not deposit any weth
    }
  });

  it("Query Wallet NFT Data", async () => {
    const {
      users,
      addressesProvider,
      bayc,
      uBAYC,
      walletProvider,
      dataProvider,
    } = testEnv;
    const depositor = users[0];
    const borrower = users[1];

    {
      const borrowerBalances = await walletProvider.getUserNftsBalances(
        addressesProvider.address,
        borrower.address
      );
      const assetIndex = borrowerBalances[0].findIndex((asset, index) => {
        if (asset === bayc.address) {
          return true;
        }
      });
      expect(assetIndex).to.not.equal(undefined);
      expect(borrowerBalances[1][assetIndex]).to.be.equal(1); // NFT 102 is not used for borrow

      const tokenData = await dataProvider.getNftTokenData(
        borrowerBalances[0][assetIndex]
      );
      const uNftBalance = await walletProvider.balanceOfNft(
        borrower.address,
        tokenData.uNftAddress
      );
      expect(uNftBalance).to.be.equal(1); // NFT 101 has used for borrow
    }

    {
      const depositorBalances = await walletProvider.getUserNftsBalances(
        addressesProvider.address,
        depositor.address
      );
      const assetIndex = depositorBalances[0].findIndex((asset, index) => {
        if (asset === bayc.address) {
          return true;
        }
      });
      expect(assetIndex).to.not.equal(undefined);
      expect(depositorBalances[1][assetIndex]).to.be.equal(0);

      const tokenData = await dataProvider.getNftTokenData(
        depositorBalances[0][assetIndex]
      );
      const uNftBalance = await walletProvider.balanceOfNft(
        depositor.address,
        tokenData.uNftAddress
      );
      expect(uNftBalance).to.be.equal(0);
    }

    {
      const batchBalances = await walletProvider.batchBalanceOfNft(
        [depositor.address, borrower.address],
        [bayc.address, uBAYC.address]
      );
      //depositor + bayc
      expect(batchBalances[0 * 2 + 0]).to.be.equal(0); // not mint any NFT
      //depositor + uBAYC
      expect(batchBalances[0 * 2 + 1]).to.be.equal(0); // not mint any NFT
      //borrower + bayc
      expect(batchBalances[1 * 2 + 0]).to.be.equal(1); // NFT 102 not used for borrow
      //borrower + uBAYC
      expect(batchBalances[1 * 2 + 1]).to.be.equal(1); // NFT 101 has used for borrow
    }
  });

  // it.skip("Batch Query Wallet NFT Token by index", async () => {
  //   const { users, bayc, uBAYC, walletProvider, dataProvider } = testEnv;
  //   const depositor = users[0];
  //   const borrower = users[1];
  //   const depositorTokenId = 2999;
  //   const borrowerTokenId = depositorTokenId - 1;

  //   await fundWithERC721("BAYC", depositor.address, depositorTokenId);
  //   await fundWithERC721("BAYC", borrower.address, borrowerTokenId);

  //   const depositorTokenIdsBayc = await walletProvider.batchTokenOfOwnerByIndex(depositor.address, bayc.address);
  //   expect(depositorTokenIdsBayc.length).to.be.equal(1);
  //   expect(depositorTokenIdsBayc[0]).to.be.equal(depositorTokenId);

  //   const borrowerTokenIdsBayc = await walletProvider.batchTokenOfOwnerByIndex(borrower.address, bayc.address);
  //   expect(borrowerTokenIdsBayc.length).to.be.equal(2); // NFT 102 not used for borrow, and nft at previous test step
  //   expect(borrowerTokenIdsBayc[1]).to.be.equal(borrowerTokenId);

  //   const borrowerTokenIdsuBAYC = await walletProvider.batchTokenOfOwnerByIndex(borrower.address, uBAYC.address);
  //   expect(borrowerTokenIdsuBAYC.length).to.be.equal(1); // NFT 101 has used for borrow
  // });

  // it.skip("Batch Query Wallet NFT Token by owner", async () => {
  //   const { users, bayc, uBAYC, walletProvider, dataProvider } = testEnv;
  //   const depositor = users[0];
  //   const borrower = users[1];
  //   const depositorTokenId = 2999;
  //   const borrowerTokenId = depositorTokenId - 1;

  //   const depositorTokenIdsBayc = await walletProvider.batchTokenOfOwner(
  //     depositor.address,
  //     bayc.address,
  //     0,
  //     depositorTokenId + 1
  //   );
  //   expect(depositorTokenIdsBayc.length).to.be.equal(1); // mint NFT in previous test step
  //   expect(depositorTokenIdsBayc[0]).to.be.equal(depositorTokenId);

  //   const borrowerTokenIdsBayc = await walletProvider.batchTokenOfOwner(
  //     borrower.address,
  //     bayc.address,
  //     0,
  //     depositorTokenId + 1
  //   );
  //   expect(borrowerTokenIdsBayc.length).to.be.equal(2); // NFT 102 not used for borrow, and nft at previous test step
  //   expect(borrowerTokenIdsBayc[1]).to.be.equal(borrowerTokenId);

  //   const borrowerTokenIdsuBAYC = await walletProvider.batchTokenOfOwner(
  //     borrower.address,
  //     uBAYC.address,
  //     0,
  //     depositorTokenId + 1
  //   );
  //   expect(borrowerTokenIdsuBAYC.length).to.be.equal(1); // NFT 101 has used for borrow
  // });

  // it.skip("Batch Query Wallet Punk", async () => {
  //   const { users, cryptoPunksMarket, walletProvider, dataProvider } = testEnv;
  //   const depositor = users[0];
  //   const borrower = users[1];
  //   const punkIndex = 2999;

  //   await waitForTx(await cryptoPunksMarket.connect(borrower.signer).getPunk(punkIndex));
  //   const borrowerPunkIndexs = await walletProvider.batchPunkOfOwner(
  //     borrower.address,
  //     cryptoPunksMarket.address,
  //     0,
  //     punkIndex + 1
  //   );
  //   expect(borrowerPunkIndexs.length).to.be.equal(1);
  //   expect(borrowerPunkIndexs[0]).to.be.equal(punkIndex);
  // });

  // it.skip("Query NFTX price for the token", async () => {
  //   const { bayc, weth, dataProvider } = testEnv;

  //   const nftxPrice = await dataProvider.getNFTXPrice(bayc.address, 101, weth.address);

  //   expect(await nftxPrice.toString()).to.equal("73289363526841320727");
  // });
});
