import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { MAX_UINT_AMOUNT } from "../../helpers/constants";
import {
  deployUnlockdCollector,
  deployUnlockdUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getMintableERC20,
  getUnlockdCollectorProxy,
  getUnlockdProxyAdminById,
  getUnlockdUpgradeableProxy,
} from "../../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  getEthersSignerByAddress,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { SignerWithAddress } from "../../test/helpers/make-suite";

task("full:deploy-unlockd-collector", "Deploy unlockd collect contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const collectorProxyAdmin = await getUnlockdProxyAdminById(
      eContractid.UnlockdProxyAdminFund
    );
    const proxyAdminOwner = await collectorProxyAdmin.owner();
    console.log(
      "Proxy Admin: address %s, owner %s",
      collectorProxyAdmin.address,
      proxyAdminOwner
    );

    const unlockdCollectorImpl = await deployUnlockdCollector(verify);
    const initEncodedData =
      unlockdCollectorImpl.interface.encodeFunctionData("initialize");

    const unlockdCollectorProxy = await deployUnlockdUpgradeableProxy(
      eContractid.UnlockdCollector,
      collectorProxyAdmin.address,
      unlockdCollectorImpl.address,
      initEncodedData,
      verify
    );
    console.log(
      "Unlockd Collector: proxy %s, implementation %s",
      unlockdCollectorProxy.address,
      unlockdCollectorImpl.address
    );
  });

task("full:upgrade-unlockd-collector", "Upgrade unlockd collect contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("proxy", "Contract proxy address")
  .addOptionalParam("initFunc", "Name of initialize function")
  .setAction(async ({ verify, pool, proxy, initFunc }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const collectorProxyAdmin = await getUnlockdProxyAdminById(
      eContractid.UnlockdProxyAdminFund
    );
    const proxyAdminOwnerAddress = await collectorProxyAdmin.owner();
    const proxyAdminOwnerSigner = await getEthersSignerByAddress(
      proxyAdminOwnerAddress
    );
    console.log(
      "Proxy Admin: address %s, owner %s",
      collectorProxyAdmin.address,
      proxyAdminOwnerAddress
    );

    const unlockdCollectorProxy = await getUnlockdUpgradeableProxy(proxy);
    console.log("Unlockd Collector: proxy %s", unlockdCollectorProxy.address);

    const unlockdCollector = await getUnlockdCollectorProxy(
      unlockdCollectorProxy.address
    );

    const unlockdCollectorImpl = await deployUnlockdCollector(verify);
    console.log(
      "Unlockd Collector: new implementation %s",
      unlockdCollectorImpl.address
    );
    insertContractAddressInDb(
      eContractid.UnlockdCollector,
      unlockdCollectorProxy.address
    );

    if (initFunc != undefined && initFunc != "") {
      const initEncodedData =
        unlockdCollectorImpl.interface.encodeFunctionData(initFunc);

      await waitForTx(
        await collectorProxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgradeAndCall(
            unlockdCollectorProxy.address,
            unlockdCollectorImpl.address,
            initEncodedData
          )
      );
    } else {
      await waitForTx(
        await collectorProxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgrade(unlockdCollectorProxy.address, unlockdCollectorImpl.address)
      );
    }

    //await waitForTx(await unlockdCollector.initialize_v2());

    console.log("Unlockd Collector: upgrade ok");
  });

task("unlockd-collector:approve-erc20", "Approve ERC20 token")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("proxy", "Contract proxy address")
  .addParam("token", "ERC20 token address")
  .addParam("to", "Target address, like 0.1")
  .addParam("amount", "Amount to approve")
  .setAction(async ({ verify, pool, proxy, token, to, amount }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const unlockdCollectorProxy = await getUnlockdUpgradeableProxy(proxy);
    console.log("Unlockd Collector: proxy %s", unlockdCollectorProxy.address);

    const unlockdCollector = await getUnlockdCollectorProxy(
      unlockdCollectorProxy.address
    );
    const ownerSigner = await getEthersSignerByAddress(
      await unlockdCollector.owner()
    );
    const signerWithAddress: SignerWithAddress = {
      address: await ownerSigner.getAddress(),
      signer: ownerSigner,
    };
    const tokenContract = await getMintableERC20(token);

    let amountDecimals = MAX_UINT_AMOUNT;
    if (amount != "-1") {
      amountDecimals = (
        await convertToCurrencyDecimals(
          signerWithAddress,
          tokenContract,
          amount
        )
      ).toString();
    }

    await waitForTx(
      await unlockdCollector
        .connect(ownerSigner)
        .approve(token, to, amountDecimals)
    );

    console.log("Unlockd Collector: approve ok");
  });
