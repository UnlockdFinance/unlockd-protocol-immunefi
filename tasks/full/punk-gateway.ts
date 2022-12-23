import { task } from "hardhat/config";
import {
  ConfigNames,
  getCryptoPunksMarketAddress,
  getWrappedPunkTokenAddress,
  loadPoolConfig,
} from "../../helpers/configuration";
import { ADDRESS_ID_PUNK_GATEWAY } from "../../helpers/constants";
import {
  deployPunkGateway,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getPunkGateway,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
  getWETHGateway,
} from "../../helpers/contracts-getters";
import { insertContractAddressInDb } from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { PunkGateway, UnlockdUpgradeableProxy } from "../../types";

task(`full:deploy-punk-gateway`, `Deploys the PunkGateway contract`)
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("verify", `Verify contract via Etherscan API.`)
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");

    if (!DRE.network.config.chainId) {
      throw new Error("INVALID_CHAIN_ID");
    }

    const poolConfig = loadPoolConfig(pool);
    const addressesProvider = await getLendPoolAddressesProvider();

    const proxyAdmin = await getUnlockdProxyAdminById(
      eContractid.UnlockdProxyAdminPool
    );
    if (proxyAdmin == undefined || !notFalsyOrZeroAddress(proxyAdmin.address)) {
      throw Error("Invalid pool proxy admin in config");
    }
    const proxyAdminOwnerAddress = await proxyAdmin.owner();
    const proxyAdminOwnerSigner = DRE.ethers.provider.getSigner(
      proxyAdminOwnerAddress
    );

    const wethGateWay = await getWETHGateway();
    console.log("wethGateWay.address", wethGateWay.address);

    const punk = await getCryptoPunksMarketAddress(poolConfig);
    console.log("CryptoPunksMarket.address", punk);

    const wpunk = await getWrappedPunkTokenAddress(poolConfig, punk);
    console.log("WPUNKS.address", wpunk);

    // this contract is not support upgrade, just deploy new contract
    const punkGateWayImpl = await deployPunkGateway(verify);
    const initEncodedData = punkGateWayImpl.interface.encodeFunctionData(
      "initialize",
      [addressesProvider.address, wethGateWay.address, punk, wpunk]
    );

    let punkGateWay: PunkGateway;
    let punkGatewayProxy: UnlockdUpgradeableProxy;

    const punkGatewayAddress = undefined; //await addressesProvider.getAddress(ADDRESS_ID_PUNK_GATEWAY);

    if (
      punkGatewayAddress != undefined &&
      notFalsyOrZeroAddress(punkGatewayAddress)
    ) {
      console.log("Upgrading exist PunkGateway proxy to new implementation...");

      await insertContractAddressInDb(
        eContractid.PunkGateway,
        punkGatewayAddress
      );
      punkGatewayProxy = await getUnlockdUpgradeableProxy(punkGatewayAddress);

      // only proxy admin can do upgrading
      await waitForTx(
        await proxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgrade(punkGatewayProxy.address, punkGateWayImpl.address)
      );

      punkGateWay = await getPunkGateway(punkGatewayProxy.address);
    } else {
      console.log("Deploying new PunkGateway proxy & implementation...");
      const punkGatewayProxy = await deployUnlockdUpgradeableProxy(
        eContractid.PunkGateway,
        proxyAdmin.address,
        punkGateWayImpl.address,
        initEncodedData,
        verify
      );

      punkGateWay = await getPunkGateway(punkGatewayProxy.address);
    }

    await waitForTx(
      await addressesProvider.setAddress(
        ADDRESS_ID_PUNK_GATEWAY,
        punkGateWay.address
      )
    );
  });

task(
  "full:punkgateway-authorize-caller-whitelist",
  "Initialize gateway configuration."
)
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("caller", "Address of whitelist")
  .addParam("flag", "Flag of whitelist, 0-1")
  .setAction(async ({ pool, caller, flag }, localBRE) => {
    await localBRE.run("set-DRE");
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);

    const punkGateway = await getPunkGateway();

    console.log("PunkGateway:", punkGateway.address);
    await waitForTx(await punkGateway.authorizeCallerWhitelist([caller], flag));
  });
