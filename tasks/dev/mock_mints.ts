import { task } from "hardhat/config";
import {
  getCryptoPunksMarket,
  getCustomERC721,
  getDeploySigner,
  getMintableERC20,
  getMintableERC721,
} from "../../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  getContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eNetwork, NftContractId } from "../../helpers/types";
import { SignerWithAddress } from "../../test/helpers/make-suite";

task("dev:mint-mock-bayc", "Mint mock nfts for dev enviroment")
  .addParam("amount", "NFT Amount (<=10)")
  .addParam("user", "Target user address")
  .setAction(async ({ amount, user }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    if (network.includes("main")) {
      throw new Error("Mint mock not used at mainnet configuration.");
    }

    // BAYC
    const baycAddress = await getContractAddressInDb("BAYC");
    const bayc = await getCustomERC721(baycAddress);
    console.log("Total amount to mint BAYC:", amount);
    await waitForTx(await bayc.mint(user, amount));
    console.log("BAYC Balances:", (await bayc.balanceOf(user)).toString());
  });

task("dev:mint-mock-all", "Mint mock nfts for dev enviroment")
  .addParam("amount", "NFT Amount (<=10)")
  .addParam("user", "Target user address")
  .setAction(async ({ amount, user }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    if (network.includes("main")) {
      throw new Error("Mint mock not used at mainnet configuration.");
    }

    for (const tokenSymbol of Object.keys(NftContractId)) {
      let tokenAddress = await getContractAddressInDb(tokenSymbol);
      let contract = await getCustomERC721(tokenAddress);
      console.log(`Total amount to mint of ${tokenSymbol}: `, amount);
      await waitForTx(await contract.mint(user, amount));
      console.log(
        `${tokenSymbol} Balance: `,
        (await contract.balanceOf(user)).toString()
      );
    }
  });

task("dev:mint-mock-nfts", "Mint mock nfts for dev enviroment")
  .addParam("index", "NFT Index of start")
  .addParam("amount", "NFT Amount (<=10)")
  .addParam("user", "Targe user address")
  .setAction(async ({ index, amount, user }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    if (network.includes("main")) {
      throw new Error("Mint mock not used at mainnet configuration.");
    }

    const deployerSigner = await getDeploySigner();
    const deployerAddress = await deployerSigner.getAddress();

    //PUNK
    const cryptoPunksMarket = await getCryptoPunksMarket();
    if (index <= 1) {
      // first time to open market to public
      await waitForTx(await cryptoPunksMarket.allInitialOwnersAssigned());
    }
    for (
      let punkIndex = Number(index);
      punkIndex < Number(index) + Number(amount);
      punkIndex++
    ) {
      console.log("Mint PUNK:", punkIndex);
      await waitForTx(await cryptoPunksMarket.getPunk(punkIndex));
      await waitForTx(await cryptoPunksMarket.transferPunk(user, punkIndex));
    }
    console.log(
      "PUNK Balances:",
      (await cryptoPunksMarket.balanceOf(user)).toString()
    );

    // const wpunkAddress = await getContractAddressInDb("WPUNKS");
    // const wpunk = await getWrappedPunk(wpunkAddress);
    // await waitForTx(await wpunk.registerProxy());

    // BAYC
    const baycAddress = await getContractAddressInDb("BAYC");
    const bayc = await getMintableERC721(baycAddress);
    if (index <= 1) {
      // first time to set base uri
      await waitForTx(
        await bayc.setBaseURI(
          "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/"
        )
      );
    }
    for (
      let tokenIndex = Number(index);
      tokenIndex < Number(index) + Number(amount);
      tokenIndex++
    ) {
      console.log("Mint BAYC:", tokenIndex);
      await waitForTx(await bayc.mint(tokenIndex));
    }
    console.log("BAYC Balances:", (await bayc.balanceOf(user)).toString());
  });

task("dev:mint-mock-reserves", "Mint mock reserves for dev enviroment")
  .addParam("amount", "Token Amount without decimals (<=1000000)")
  .addParam("user", "Targe user address")
  .setAction(async ({ amount, user }, DRE) => {
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    if (network.includes("main")) {
      throw new Error("Mint mock not used at mainnet configuration.");
    }

    const deployerSigner = await getDeploySigner();
    const signerWithAddress: SignerWithAddress = {
      address: await deployerSigner.getAddress(),
      signer: deployerSigner,
    };

    // DAI
    const daiAddress = await getContractAddressInDb("DAI");
    const dai = await getMintableERC20(daiAddress);
    const daiAmountToMint = await convertToCurrencyDecimals(
      signerWithAddress,
      dai,
      amount
    );
    await waitForTx(await dai.mint(daiAmountToMint));
    await waitForTx(await dai.transfer(user, daiAmountToMint));
    console.log("DAI Balances:", (await dai.balanceOf(user)).toString());

    // USDC
    const usdcAddress = await getContractAddressInDb("USDC");
    const usdc = await getMintableERC20(usdcAddress);
    const usdcAmountToMint = await convertToCurrencyDecimals(
      signerWithAddress,
      usdc,
      amount
    );
    await waitForTx(await usdc.mint(usdcAmountToMint));
    await waitForTx(await usdc.transfer(user, usdcAmountToMint));
    console.log("USDC Balances:", (await dai.balanceOf(user)).toString());
  });
