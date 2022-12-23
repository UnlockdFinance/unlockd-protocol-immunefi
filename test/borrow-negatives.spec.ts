import { parseEther } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { getReservesConfigByPool } from "../helpers/configuration";
import { ONE_YEAR } from "../helpers/constants";
import {
  advanceTimeAndBlock,
  fundWithERC20,
  fundWithERC721,
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
  deposit,
  setApprovalForAll,
} from "./helpers/actions";
import { makeSuite, TestEnv } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { VL_TIMEFRAME_EXCEEDED } = ProtocolErrors;
const { expect } = require("chai");

makeSuite("LendPool: Borrow negative test cases", (testEnv: TestEnv) => {
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

  it("Users 0 Deposits 100 WETH and user 1 tries to borrow 0 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("WETH", user0.address, "1000");

    await approveERC20(testEnv, user0, "WETH");

    await deposit(
      testEnv,
      user0,
      "",
      "WETH",
      "1000",
      user0.address,
      "success",
      ""
    );

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user1.address, tokenIdNum);

    await setApprovalForAll(testEnv, user1, "BAYC");

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
      "0",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      ProtocolErrors.VL_INVALID_AMOUNT
    );

    cachedTokenId = tokenId;
  });

  it("User 1 tries to use underpriced NFT as collateral to borrow 100 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user2 = users[2];

    await expect(cachedTokenId, "previous test case is failed").to.not.be
      .undefined;
    const tokenId = cachedTokenId.toString();

    await configurator.setLtvManagerStatus(deployer.address, true);
    await nftOracle.setPriceManagerStatus(configurator.address, true);

    const collData: IConfigNftAsCollateralInput = {
      asset: bayc.address,
      nftTokenId: tokenId,
      newPrice: parseEther("1"),
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
      "WETH",
      "100",
      "BAYC",
      tokenId,
      user2.address,
      "",
      "revert",
      ProtocolErrors.VL_COLLATERAL_CANNOT_COVER_NEW_BORROW
    );
  });

  it("User 2 tries to uses user 1 owned NFT as collateral to borrow 10 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user2 = users[2];

    expect(cachedTokenId, "previous test case is failed").to.not.be.undefined;
    const tokenId = cachedTokenId.toString();

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
      "WETH",
      "10",
      "BAYC",
      tokenId,
      user2.address,
      "",
      "revert",
      "ERC721: transfer of token that is not own"
    );
  });

  it("Tries to uses NFT which id exceed max limit as collateral to borrow 10 WETH (revert expected)", async () => {
    const { users, configurator, deployer, pool, bayc, nftOracle } = testEnv;
    const user1 = users[1];

    const tokenId = "100001";

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
      "10",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      ProtocolErrors.LP_NFT_TOKEN_ID_EXCEED_MAX_LIMIT
    );
  });

  it("Users 0 Deposits 100 WETH and user 1 tries to borrow but the timestamp exceeds", async () => {
    const {
      users,
      pool,
      bayc,
      weth,
      deployer,
      configurator,
      nftOracle,
      dataProvider,
    } = testEnv;
    const user0 = users[0];
    const user1 = users[1];

    await fundWithERC20("WETH", user0.address, "1000");

    await approveERC20(testEnv, user0, "WETH");

    await deposit(
      testEnv,
      user0,
      "",
      "WETH",
      "1000",
      user0.address,
      "success",
      ""
    );

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();
    await fundWithERC721("BAYC", user1.address, tokenIdNum);

    await setApprovalForAll(testEnv, user1, "BAYC");

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

    const secondsToTravel = new BigNumber(3600001)
      .multipliedBy(ONE_YEAR)
      .div(365)
      .toNumber();
    await advanceTimeAndBlock(secondsToTravel);

    await borrow(
      testEnv,
      user1,
      "WETH",
      "10",
      "BAYC",
      tokenId,
      user1.address,
      "",
      "revert",
      ProtocolErrors.VL_TIMEFRAME_EXCEEDED
    );
  });
});
