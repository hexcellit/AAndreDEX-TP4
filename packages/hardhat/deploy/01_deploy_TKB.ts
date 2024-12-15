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

const deployTokenB: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const tokenB = await deploy('TokenB', {
    from: deployer,
    args: [],
    log: true,
  });

  // Save ABI
  saveABI('TokenB', tokenB.abi);
};

export default deployTokenB;
deployTokenB.tags = ['TokenB'];
