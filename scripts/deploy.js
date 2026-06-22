
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const TrancheToken = await hre.ethers.getContractFactory("TrancheToken");

  const senior = await TrancheToken.deploy("Senior Tranche", "sCDO", deployer.address);
  await senior.waitForDeployment();
  console.log("Senior Tranche deployed to:", await senior.getAddress());

  const mezzanine = await TrancheToken.deploy("Mezzanine Tranche", "mCDO", deployer.address);
  await mezzanine.waitForDeployment();
  console.log("Mezzanine Tranche deployed to:", await mezzanine.getAddress());

  const junior = await TrancheToken.deploy("Junior Tranche", "jCDO", deployer.address);
  await junior.waitForDeployment();
  console.log("Junior Tranche deployed to:", await junior.getAddress());

  const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

  const CDOVault = await hre.ethers.getContractFactory("CDOVault");
  const vault = await CDOVault.deploy(SEPOLIA_ETH_USD_FEED);
  await vault.waitForDeployment();
  console.log("CDOVault deployed to:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});