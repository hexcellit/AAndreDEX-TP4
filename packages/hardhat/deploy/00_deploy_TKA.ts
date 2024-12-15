import path from 'path';
import fs from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const saveABI = (contractName: string, abi: any) => {
  const abiPath = path.resolve(__dirname, '..', '..', 'nextjs', 'abis', `${contractName}.json`);
  const abiDirectory = path.dirname(abiPath);
  if (!fs.existsSync(abiDirectory)) {
    fs.mkdirSync(abiDirectory, { recursive: true });
  }
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`✅ ABI for ${contractName} saved to ${abiPath}`);
};

const deployTokenA: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const tokenA = await deploy('TokenA', {
    from: deployer,
    args: [],
    log: true,
  });

  // Save ABI
  saveABI('TokenA', tokenA.abi);
};

export default deployTokenA;
deployTokenA.tags = ['TokenA'];
