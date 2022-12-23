import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { getUnlockdProtocolDataProvider } from "../../helpers/contracts-getters";
import { eNetwork } from "../../helpers/types";

task("print-nft", "Print data of specified nft")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addOptionalParam("asset", `NFT address`)
  .addOptionalParam("tokenId", `NFT Token ID`)
  .addOptionalParam("loanId", `NFT Loan ID`)
  .setAction(async ({ pool, asset, tokenId, loanId }, localBRE) => {
    await localBRE.run("set-DRE");
    const network = process.env.FORK
      ? (process.env.FORK as eNetwork)
      : (localBRE.network.name as eNetwork);
    const poolConfig = loadPoolConfig(pool);

    const protocolDataProvider = await getUnlockdProtocolDataProvider();

    let loanData;
    if (loanId != undefined) {
      loanData = await protocolDataProvider.getLoanDataByLoanId(loanId);
    } else {
      loanData = await protocolDataProvider.getLoanDataByCollateral(
        asset,
        tokenId
      );
    }

    console.log(`- nft loan data`);
    const loanFields = [
      "loanId",
      "state",
      "nftAsset",
      "nftTokenId",
      "borrower",
      "reserveAsset",
      "scaledAmount",
      "currentAmount",
    ];
    loanFields.forEach((field, index) => {
      console.log(`  - ${field}:`, loanData[field].toString());
    });
  });
