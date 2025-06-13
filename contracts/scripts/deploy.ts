import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Get the deployer's signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ForestToken
  console.log("Deploying ForestToken...");
  const ForestToken = await ethers.getContractFactory("ForestToken");
  const forestToken = await ForestToken.deploy();
  await forestToken.waitForDeployment();
  const forestTokenAddress = await forestToken.getAddress();
  console.log(`ForestToken deployed to: ${forestTokenAddress}`);

  // Deploy ForestNFT
  console.log("Deploying ForestNFT...");
  const ForestNFT = await ethers.getContractFactory("ForestNFT");
  const forestNFT = await ForestNFT.deploy();
  await forestNFT.waitForDeployment();
  const forestNFTAddress = await forestNFT.getAddress();
  console.log(`ForestNFT deployed to: ${forestNFTAddress}`);

  // Save the deployed addresses
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`ForestToken: ${forestTokenAddress}`);
  console.log(`ForestNFT: ${forestNFTAddress}`);
  console.log("-------------------");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
