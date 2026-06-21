
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});