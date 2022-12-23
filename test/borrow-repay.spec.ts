import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  fundWithERC20,
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
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  delegateBorrowAllowance,
  deposit,
  repay,
  setApprovalForAll,
  withdraw,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("LendPool: Borrow/repay test cases", (testEnv: TestEnv) => {
  let cachedTokenId;

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

  it("User 2 deposits 1 WETH and 1000 DAI to account for rounding errors", async () => {
    const { users } = testEnv;
    const user2 = users[2];

    // WETH
    await fundWithERC20("WETH", user2.address, "1");

    await approveERC20(testEnv, user2, "WETH");

    await deposit(
      testEnv,
      user2,
      "",
      "WETH",
      "1",
      user2.address,
      "success",
      ""
    );

    // DAI
    await fundWithERC20("DAI", user2.address, "1000");

    await approveERC20(testEnv, user2, "DAI");

    await deposit(
      testEnv,
      user2,
      "",
      "DAI",
      "1000",
      user2.address,
      "success",
      ""
    );
  });

  it("User 0 deposits 100 WETH, user 1 uses NFT as collateral and borrows 1 WETH", async () => {
    const { users, configurator, nftOracle, deployer, bayc, weth } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("WETH", user0.address, "100");

    await approveERC20(testEnv, user0, "WETH");

    //await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());

    await deposit(
      testEnv,
      user0,
      "",
      "WETH",
      "100",
      user0.address,
      "success",
      ""
    );

    // const checkResult1 = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // await expect(checkResult1).to.be.equal(true, "IncentivesController not called");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user1.address, tokenIdNum);

    await setApprovalForAll(testEnv, user1, "BAYC");

    //await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const price = await convertToCurrencyDecimals(user0, weth, "100");
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(bayc.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user1,
      "WETH",
      "1",
      "BAYC",
      tokenId,
      user1.address,
      "365",
      "success",
      ""
    );

    // const checkResult2 = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // await expect(checkResult2).to.be.equal(true, "IncentivesController not called");

    cachedTokenId = tokenId;
  });

  it("User 1 uses existed collateral and borrows more 100 DAI (revert expected)", async () => {
    const { users, configurator, deployer, nftOracle, bayc } = testEnv;
    const user1 = users[1];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user1,
      "DAI",
      "200",
      "BAYC",
      tokenId,
      user1.address,
      "365",
      "revert",
      ProtocolErrors.VL_SPECIFIED_RESERVE_NOT_BORROWED_BY_USER
    );
  });

  it("User 1 uses existed collateral and borrows more 2 WETH", async () => {
    const { users, configurator, deployer, nftOracle, bayc } = testEnv;
    const user1 = users[1];

    await expect(cachedTokenId, "previous test case is failed").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user1,
      "WETH",
      "2",
      "BAYC",
      tokenId,
      user1.address,
      "365",
      "success",
      ""
    );

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // await expect(checkResult).to.be.equal(true, "IncentivesController not called");
  });

  it("User 1 tries to borrow more than the rest of the WETH liquidity (revert expected)", async () => {
    const { users, configurator, deployer, nftOracle, bayc } = testEnv;
    const user1 = users[1];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("1000"),
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

    await borrow(
      testEnv,
      user1,
      "WETH",
      "100",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      ProtocolErrors.LP_RESERVES_WITHOUT_ENOUGH_LIQUIDITY
    );
  });

  it("User 1 tries to repay 0 WETH (revert expected)", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await repay(
      testEnv,
      user1,
      "WETH",
      "",
      "BAYC",
      tokenId,
      "0",
      user1,
      "revert",
      ProtocolErrors.VL_INVALID_AMOUNT
    );
  });

  it("User 1 repays 0.5 WETH, enough to cover a small part of the interest", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await approveERC20(testEnv, user1, "WETH");

    //await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());

    await repay(
      testEnv,
      user1,
      "WETH",
      "",
      "BAYC",
      tokenId,
      "0.5",
      user1,
      "success",
      ""
    );

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // await expect(checkResult).to.be.equal(true, "IncentivesController not called");
  });

  it("User 1 repays all WETH borrow after one year", async () => {
    const { users } = testEnv;
    const user1 = users[1];

    await fundWithERC20("WETH", user1.address, "10");

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await approveERC20(testEnv, user1, "WETH");

    await waitForTx(
      await testEnv.mockIncentivesController.resetHandleActionIsCalled()
    );

    await repay(
      testEnv,
      user1,
      "WETH",
      "",
      "BAYC",
      tokenId,
      "-1",
      user1,
      "success",
      ""
    );

    // const checkResult = await testEnv.mockIncentivesController.checkHandleActionIsCalled();
    // await waitForTx(await testEnv.mockIncentivesController.resetHandleActionIsCalled());
    // await expect(checkResult).to.be.equal(true, "IncentivesController not called");
  });

  it("User 0 withdraws the deposited WETH plus interest", async () => {
    const { users } = testEnv;
    const user0 = users[0];

    await withdraw(testEnv, user0, "WETH", "-1", "success", "");
  });

  it("User 1 deposits 1 USDC to account for rounding errors", async () => {
    const { users } = testEnv;
    const user2 = users[2];

    await fundWithERC20("USDC", user2.address, "1");

    await approveERC20(testEnv, user2, "USDC");

    await deposit(
      testEnv,
      user2,
      "",
      "USDC",
      "1",
      user2.address,
      "success",
      ""
    );
  });

  it("User 1 deposits 1000 USDC, user 3 uses not owned NFT as collateral and borrows 10 USDC", async () => {
    const { users, configurator, nftOracle, deployer, bayc } = testEnv;
    const user1 = users[1];
    const user2 = users[2];
    const user3 = users[3];

    await fundWithERC20("USDC", user1.address, "1000");

    await approveERC20(testEnv, user1, "USDC");

    await deposit(
      testEnv,
      user1,
      "",
      "USDC",
      "100",
      user1.address,
      "success",
      ""
    );

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await fundWithERC721("BAYC", user2.address, tokenIdNum);
    await setApprovalForAll(testEnv, user2, "BAYC");

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user3,
      "USDC",
      "10",
      "BAYC",
      tokenId,
      user3.address,
      "",
      "revert",
      "ERC721: transfer of token that is not own"
    );

    cachedTokenId = tokenId;
  });

  it("user 2 uses owned NFT as collateral on behalf of user 3 and borrows 10 USDC", async () => {
    const { users, configurator, nftOracle, deployer, bayc } = testEnv;
    const user2 = users[2];
    const user3 = users[3];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await delegateBorrowAllowance(
      testEnv,
      user3,
      "USDC",
      "10",
      user2.address,
      "success",
      ""
    );

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user2,
      "USDC",
      "10",
      "BAYC",
      tokenId,
      user3.address,
      "365",
      "success",
      ""
    );
  });

  it("user 2 uses existed collateral on behalf of user 3 and borrows more 20 USDC", async () => {
    const { users, configurator, nftOracle, deployer, bayc } = testEnv;
    const user2 = users[2];
    const user3 = users[3];

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await delegateBorrowAllowance(
      testEnv,
      user3,
      "USDC",
      "100",
      user2.address,
      "success",
      ""
    );
    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
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

    await borrow(
      testEnv,
      user2,
      "USDC",
      "20",
      "BAYC",
      tokenId,
      user3.address,
      "365",
      "success",
      ""
    );
  });

  it("user 3 repay 10 USDC, a fraction of borrow amount", async () => {
    const { users } = testEnv;
    const user2 = users[2];
    const user3 = users[3];

    await fundWithERC20("USDC", user3.address, "1000");
    await approveERC20(testEnv, user3, "USDC");

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await repay(
      testEnv,
      user3,
      "USDC",
      "",
      "BAYC",
      tokenId,
      "10",
      user3,
      "success",
      ""
    );
  });

  it("user 3 repay all USDC, full of borrow amount", async () => {
    const { users } = testEnv;
    const user2 = users[2];
    const user3 = users[3];

    await fundWithERC20("USDC", user3.address, "1000");

    await approveERC20(testEnv, user3, "USDC");

    await expect(cachedTokenId, "previous test case is faild").to.not.be
      .undefined;
    const tokenId = cachedTokenId;

    await repay(
      testEnv,
      user3,
      "USDC",
      "",
      "BAYC",
      tokenId,
      "-1",
      user3,
      "success",
      ""
    );
  });
});
