import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployUnlockdProxyAdmin } from "../../helpers/contracts-deployments";
import { getUnlockdProxyAdminByAddress } from "../../helpers/contracts-getters";
import {
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress } from "../../helpers/misc-utils";
import { eContractid, eNetwork } from "../../helpers/types";
import { UnlockdProxyAdmin } from "../../types";

task("full:deploy-proxy-admin", "Deploy proxy admin contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("skipPool", "Skip proxy admin for POOL")
  .addFlag("skipFund", "Skip proxy admin for FUND")
  .setAction(async ({ verify, pool, skipPool, skipFund }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    if (!skipPool) {
      let proxyAdmin: UnlockdProxyAdmin;
      const proxyAdminAddress = getParamPerNetwork(
        poolConfig.ProxyAdminPool,
        network
      );

      if (
        proxyAdminAddress == undefined ||
        !notFalsyOrZeroAddress(proxyAdminAddress)
      ) {
        proxyAdmin = await deployUnlockdProxyAdmin(
          eContractid.UnlockdProxyAdminPool,
          verify
        );
      } else {
        await insertContractAddressInDb(
          eContractid.UnlockdProxyAdminPool,
          proxyAdminAddress
        );

        proxyAdmin = await getUnlockdProxyAdminByAddress(proxyAdminAddress);
      }
      console.log(
        "ProxyAdminPool Address:",
        proxyAdmin.address,
        "Owner Address:",
        await proxyAdmin.owner()
      );
    }

    if (!skipFund) {
      let proxyAdmin: UnlockdProxyAdmin;
      const proxyAdminAddress = getParamPerNetwork(
        poolConfig.ProxyAdminFund,
        network
      );
      if (
        proxyAdminAddress == undefined ||
        !notFalsyOrZeroAddress(proxyAdminAddress)
      ) {
        proxyAdmin = await deployUnlockdProxyAdmin(
          eContractid.UnlockdProxyAdminFund,
          verify
        );
      } else {
        await insertContractAddressInDb(
          eContractid.UnlockdProxyAdminFund,
          proxyAdminAddress
        );
        proxyAdmin = await getUnlockdProxyAdminByAddress(proxyAdminAddress);
      }
      console.log(
        "UnlockdProxyAdminFund Address:",
        proxyAdmin.address,
        "Owner Address:",
        await proxyAdmin.owner()
      );
    }
  });
