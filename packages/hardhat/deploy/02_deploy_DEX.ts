import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySimpleDEX: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Fetch deployed TokenA and TokenB
  const tokenA = await get("TokenA");
  const tokenB = await get("TokenB");

  await deploy("SimpleDEX", {
    from: deployer,
    args: [tokenA.address, tokenB.address], // Pass token addresses to the constructor
    log: true,
    autoMine: true,
  });

  console.log("✅ SimpleDEX deployed successfully with TokenA:", tokenA.address, "and TokenB:", tokenB.address);
};

export default deploySimpleDEX;
deploySimpleDEX.tags = ["SimpleDEX"];
deploySimpleDEX.dependencies = ["TokenA", "TokenB"]; // Ensures these scripts run first
