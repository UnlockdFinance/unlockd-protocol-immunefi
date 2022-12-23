import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployLendPoolAddressesProvider,
  deployLendPoolAddressesProviderRegistry,
} from "../../helpers/contracts-deployments";
import {
  getDeploySigner,
  getNFTXVaultFactory,
  getSushiSwapRouter,
} from "../../helpers/contracts-getters";
import { waitForTx } from "../../helpers/misc-utils";

task(
  "dev:deploy-address-provider",
  "Deploy address provider for dev enviroment"
)
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const signer = await getDeploySigner();
    const admin = await signer.getAddress();
    const sushiRouter = await getSushiSwapRouter();
    const nftx = await getNFTXVaultFactory();
    //const dataProvider = await getUnlockdProtocolDataProvider();

    const addressesProvider = await deployLendPoolAddressesProvider(
      poolConfig.MarketId,
      verify
    );
    await waitForTx(await addressesProvider.setPoolAdmin(admin));
    await waitForTx(await addressesProvider.setEmergencyAdmin(admin));
    await waitForTx(
      await addressesProvider.setSushiSwapRouter(sushiRouter.address)
    );
    await waitForTx(await addressesProvider.setNFTXVaultFactory(nftx.address));
    //await waitForTx(await addressesProvider.setUnlockdDataProvider(dataProvider.address));

    const addressesProviderRegistry =
      await deployLendPoolAddressesProviderRegistry(verify);
    await waitForTx(
      await addressesProviderRegistry.registerAddressesProvider(
        addressesProvider.address,
        poolConfig.ProviderId
      )
    );
  });
