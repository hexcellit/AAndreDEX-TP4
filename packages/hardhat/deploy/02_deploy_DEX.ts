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

const deploySimpleDEX: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  const tokenA = await get('TokenA');
  const tokenB = await get('TokenB');

  const simpleDEX = await deploy('SimpleDEX', {
    from: deployer,
    args: [tokenA.address, tokenB.address],
    log: true,
  });

  // Save ABI
  saveABI('SimpleDEX', simpleDEX.abi);
};

export default deploySimpleDEX;
deploySimpleDEX.tags = ['SimpleDEX'];
deploySimpleDEX.dependencies = ['TokenA', 'TokenB'];
