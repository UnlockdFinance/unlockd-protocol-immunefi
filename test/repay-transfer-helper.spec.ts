import BigNumber from "bignumber.js";
import { parseEther } from "ethers/lib/utils";
import { getReservesConfigByPool } from "../helpers/configuration";
import { getDeploySigner } from "../helpers/contracts-getters";
import { convertToCurrencyDecimals } from "../helpers/contracts-helpers";
import {
  fundWithERC20,
  fundWithERC721,
  increaseTime,
  waitForTx,
} from "../helpers/misc-utils";
import {
  IConfigNftAsCollateralInput,
  IReserveParams,
  iUnlockdPoolAssets,
  UnlockdPools,
} from "../helpers/types";
import {
  RepayAndTransferHelper,
  RepayAndTransferHelperFactory,
} from "../types";
import {
  approveERC20,
  borrow,
  configuration as actionsConfiguration,
  deposit,
  setApprovalForAll,
  setApprovalForAllExt,
} from "./helpers/actions";
import { makeSuite } from "./helpers/make-suite";
import { configuration as calculationsConfiguration } from "./helpers/utils/calculations";

const { expect } = require("chai");

makeSuite("Repay and transfer helper tests", async (testEnv) => {
  let saveBaycAssetPrice: string;
  let repayAndTransferHelper: RepayAndTransferHelper;

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

    repayAndTransferHelper = await new RepayAndTransferHelperFactory(
      await getDeploySigner()
    ).deploy(testEnv.addressesProvider.address);
  });
  after("Reset", () => {
    // Reset BigNumber
    BigNumber.config({
      DECIMAL_PLACES: 20,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    });
  });

  it("borrow-repay-transfer", async () => {
    const { users, bayc, deployer, weth, configurator, nftOracle } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const borrower2 = users[2];

    // deposit
    await fundWithERC20("WETH", depositor.address, "100");
    await approveERC20(testEnv, depositor, "WETH");

    await deposit(
      testEnv,
      depositor,
      "",
      "WETH",
      "100",
      depositor.address,
      "success",
      ""
    );

    await increaseTime(100);

    // mint nft
    await fundWithERC20("WETH", borrower.address, "100");
    await approveERC20(testEnv, borrower, "WETH");

    const tokenIdNum = testEnv.tokenIdTracker++;
    const tokenId = tokenIdNum.toString();

    await fundWithERC721("BAYC", borrower.address, tokenIdNum);
    await setApprovalForAll(testEnv, borrower, "BAYC");

    // borrow
    const price = await convertToCurrencyDecimals(deployer, weth, "100");
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

    await borrow(
      testEnv,
      borrower,
      "WETH",
      "5",
      "BAYC",
      tokenId,
      borrower.address,
      "365",
      "success",
      ""
    );

    await increaseTime(100);

    await setApprovalForAllExt(
      testEnv,
      borrower,
      "BAYC",
      repayAndTransferHelper.address
    );

    await waitForTx(
      await repayAndTransferHelper.repayETHAndTransferERC721(
        bayc.address,
        tokenId,
        borrower2.address,
        {
          value: parseEther("100"),
        }
      )
    );

    expect(await bayc.ownerOf(tokenId), "debt should gte borrowSize").to.be.eq(
      borrower2.address
    );
  });
});
