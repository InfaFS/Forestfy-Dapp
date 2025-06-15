import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting full deployment of Forestfy contracts...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);
  console.log(
    `💰 Account balance: ${ethers.formatEther(
      await deployer.provider.getBalance(deployer.address)
    )} ETH\n`
  );

  // ================================
  // 1. DEPLOY FOREST TOKEN
  // ================================
  console.log("1️⃣ Deploying ForestToken...");
  const ForestToken = await ethers.getContractFactory("ForestToken");
  const forestToken = await ForestToken.deploy();
  await forestToken.waitForDeployment();
  const forestTokenAddress = await forestToken.getAddress();
  console.log(`✅ ForestToken deployed to: ${forestTokenAddress}`);

  // Verify ForestToken deployment
  const tokenName = await forestToken.name();
  const tokenSymbol = await forestToken.symbol();
  const ownerBalance = await forestToken.virtualBalance(deployer.address);
  console.log(`   📋 Token Name: ${tokenName}`);
  console.log(`   📋 Token Symbol: ${tokenSymbol}`);
  console.log(
    `   💰 Owner Virtual Balance: ${ethers.formatEther(ownerBalance)} FOREST\n`
  );

  // ================================
  // 2. DEPLOY FOREST NFT
  // ================================
  console.log("2️⃣ Deploying ForestNFT...");
  const ForestNFT = await ethers.getContractFactory("ForestNFT");
  const forestNFT = await ForestNFT.deploy();
  await forestNFT.waitForDeployment();
  const forestNFTAddress = await forestNFT.getAddress();
  console.log(`✅ ForestNFT deployed to: ${forestNFTAddress}`);

  // Verify ForestNFT deployment
  const nftName = await forestNFT.name();
  const nftSymbol = await forestNFT.symbol();
  const treesPerParcel = await forestNFT.TREES_PER_PARCEL();
  console.log(`   📋 NFT Name: ${nftName}`);
  console.log(`   📋 NFT Symbol: ${nftSymbol}`);
  console.log(`   🌳 Trees per Parcel: ${treesPerParcel}\n`);

  // ================================
  // 3. DEPLOY MARKETPLACE
  // ================================
  console.log("3️⃣ Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    forestNFTAddress,
    forestTokenAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`✅ Marketplace deployed to: ${marketplaceAddress}`);

  // Verify Marketplace deployment
  const marketplaceFee = await marketplace.marketplaceFee();
  console.log(`   💰 Marketplace Fee: ${marketplaceFee}%\n`);

  // ================================
  // 4. SETUP AUTHORIZATIONS
  // ================================
  console.log("4️⃣ Setting up contract authorizations...");

  // Authorize Marketplace on ForestNFT
  console.log("   📝 Authorizing Marketplace on ForestNFT...");
  const nftAuthTx = await forestNFT.addAuthorizedContract(marketplaceAddress);
  await nftAuthTx.wait();
  console.log("   ✅ ForestNFT authorization complete");

  // Authorize Marketplace on ForestToken
  console.log("   📝 Authorizing Marketplace on ForestToken...");
  const tokenAuthTx = await forestToken.addAuthorizedContract(
    marketplaceAddress
  );
  await tokenAuthTx.wait();
  console.log("   ✅ ForestToken authorization complete\n");

  // ================================
  // 5. VERIFICATION
  // ================================
  console.log("5️⃣ Verifying setup...");

  // Verify authorizations
  const isNFTAuthorized = await forestNFT.authorizedContracts(
    marketplaceAddress
  );
  const isTokenAuthorized = await forestToken.authorizedContracts(
    marketplaceAddress
  );

  console.log(`   🔐 ForestNFT authorized: ${isNFTAuthorized}`);
  console.log(`   🔐 ForestToken authorized: ${isTokenAuthorized}`);

  // Verify contract connections in Marketplace
  const marketplaceNFTAddress = await marketplace.forestNFT();
  const marketplaceTokenAddress = await marketplace.forestToken();

  console.log(`   🔗 Marketplace -> ForestNFT: ${marketplaceNFTAddress}`);
  console.log(`   🔗 Marketplace -> ForestToken: ${marketplaceTokenAddress}\n`);

  // ================================
  // 6. OPTIONAL INITIAL SETUP
  // ================================
  console.log("6️⃣ Optional initial setup...");

  // Example: Assign parcels to deployer for testing
  console.log("   🏞️ Assigning 5 parcels to deployer for testing...");
  const assignParcelsTx = await forestNFT.assignParcels(deployer.address, 5);
  await assignParcelsTx.wait();

  const deployerParcels = await forestNFT.getUserParcels(deployer.address);
  console.log(`   ✅ Deployer parcels: ${deployerParcels}`);

  // Example: Mint a test NFT
  console.log("   🎨 Minting test NFT to deployer...");
  const mintTx = await forestNFT.mintTo(deployer.address, 25); // 2.5 tokens worth
  await mintTx.wait();

  const deployerTokens = await forestNFT.tokensOfOwner(deployer.address);
  console.log(`   ✅ Deployer NFTs: [${deployerTokens.join(", ")}]\n`);

  // ================================
  // 7. DEPLOYMENT SUMMARY
  // ================================
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("📋 CONTRACT ADDRESSES:");
  console.log(`   ForestToken:  ${forestTokenAddress}`);
  console.log(`   ForestNFT:    ${forestNFTAddress}`);
  console.log(`   Marketplace:  ${marketplaceAddress}`);
  console.log("=".repeat(50));
  console.log("⚙️  CONFIGURATION:");
  console.log(`   Marketplace Fee: ${marketplaceFee}%`);
  console.log(`   Trees per Parcel: ${treesPerParcel}`);
  console.log(`   Owner: ${deployer.address}`);
  console.log("=".repeat(50));
  console.log("✅ AUTHORIZATIONS:");
  console.log(`   Marketplace -> ForestNFT: ${isNFTAuthorized}`);
  console.log(`   Marketplace -> ForestToken: ${isTokenAuthorized}`);
  console.log("=".repeat(50));

  // ================================
  // 8. NEXT STEPS
  // ================================
  console.log("📝 NEXT STEPS:");
  console.log("1. Update your backend .env with the new contract addresses:");
  console.log(`   FOREST_TOKEN_ADDRESS=${forestTokenAddress}`);
  console.log(`   FOREST_NFT_ADDRESS=${forestNFTAddress}`);
  console.log(`   MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log("");
  console.log("2. Update your frontend configuration with the new addresses");
  console.log("");
  console.log("3. Test the contracts:");
  console.log(
    `   - Mint NFTs: npx hardhat run scripts/test-mint.ts --network <network>`
  );
  console.log(
    `   - Test Marketplace: npx hardhat run scripts/test-marketplace.ts --network <network>`
  );
  console.log("");
  console.log("4. Verify contracts on block explorer (if needed):");
  console.log(
    `   npx hardhat verify ${forestTokenAddress} --network <network>`
  );
  console.log(`   npx hardhat verify ${forestNFTAddress} --network <network>`);
  console.log(
    `   npx hardhat verify ${marketplaceAddress} ${forestNFTAddress} ${forestTokenAddress} --network <network>`
  );

  // ================================
  // 9. SAVE DEPLOYMENT INFO
  // ================================
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ForestToken: forestTokenAddress,
      ForestNFT: forestNFTAddress,
      Marketplace: marketplaceAddress,
    },
    configuration: {
      marketplaceFee: marketplaceFee.toString(),
      treesPerParcel: treesPerParcel.toString(),
    },
  };

  console.log("");
  console.log("💾 DEPLOYMENT INFO (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
