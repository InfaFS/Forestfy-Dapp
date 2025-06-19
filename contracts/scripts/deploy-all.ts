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
  // 4. DEPLOY USER REGISTRY
  // ================================
  console.log("4️⃣ Deploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry deployed to: ${userRegistryAddress}`);

  // Verify UserRegistry deployment
  const userRegistryOwner = await userRegistry.owner();
  const totalUsers = await userRegistry.getTotalUsers();
  console.log(`   👑 Owner: ${userRegistryOwner}`);
  console.log(`   👥 Total Users: ${totalUsers}\n`);

  // ================================
  // 5. SETUP AUTHORIZATIONS
  // ================================
  console.log("5️⃣ Setting up contract authorizations...");

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
  console.log("   ✅ ForestToken authorization complete");

  // Authorize UserRegistry on ForestToken
  console.log("   📝 Authorizing UserRegistry on ForestToken...");
  const userTokenAuthTx = await forestToken.addAuthorizedContract(
    userRegistryAddress
  );
  await userTokenAuthTx.wait();
  console.log("   ✅ UserRegistry authorization on ForestToken complete");

  // Set ForestToken address in UserRegistry
  console.log("   📝 Setting ForestToken address in UserRegistry...");
  const setTokenTx = await (userRegistry as any).setForestTokenAddress(
    forestTokenAddress
  );
  await setTokenTx.wait();
  console.log("   ✅ ForestToken address set in UserRegistry\n");

  // ================================
  // 6. VERIFICATION
  // ================================
  console.log("6️⃣ Verifying setup...");

  // Verify authorizations
  const isNFTAuthorized = await forestNFT.authorizedContracts(
    marketplaceAddress
  );
  const isTokenAuthorized = await forestToken.authorizedContracts(
    marketplaceAddress
  );
  const isUserRegistryAuthorized = await forestToken.authorizedContracts(
    userRegistryAddress
  );

  console.log(`   🔐 ForestNFT authorized: ${isNFTAuthorized}`);
  console.log(`   🔐 ForestToken authorized: ${isTokenAuthorized}`);
  console.log(`   🔐 UserRegistry authorized: ${isUserRegistryAuthorized}`);

  // Verify contract connections in Marketplace
  const marketplaceNFTAddress = await marketplace.forestNFT();
  const marketplaceTokenAddress = await marketplace.forestToken();

  console.log(`   🔗 Marketplace -> ForestNFT: ${marketplaceNFTAddress}`);
  console.log(`   🔗 Marketplace -> ForestToken: ${marketplaceTokenAddress}\n`);

  // ================================
  // 7. OPTIONAL INITIAL SETUP
  // ================================
  console.log("7️⃣ Optional initial setup...");

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
  console.log(`   ✅ Deployer NFTs: [${deployerTokens.join(", ")}]`);

  // Register deployer in UserRegistry for testing
  console.log("   👤 Registering deployer in UserRegistry...");
  try {
    const registerTx = await userRegistry.registerUser("Admin");
    await registerTx.wait();
    console.log("   ✅ Deployer registered in UserRegistry");
  } catch (error: any) {
    console.log(`   ⚠️ UserRegistry registration note: ${error.message}`);
  }

  const finalTotalUsers = await userRegistry.getTotalUsers();
  console.log(`   👥 Final Total Users in Registry: ${finalTotalUsers}\n`);

  // ================================
  // 8. DEPLOYMENT SUMMARY
  // ================================
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("📋 CONTRACT ADDRESSES:");
  console.log(`   ForestToken:   ${forestTokenAddress}`);
  console.log(`   ForestNFT:     ${forestNFTAddress}`);
  console.log(`   Marketplace:   ${marketplaceAddress}`);
  console.log(`   UserRegistry:  ${userRegistryAddress}`);
  console.log("=".repeat(50));
  console.log("⚙️  CONFIGURATION:");
  console.log(`   Marketplace Fee: ${marketplaceFee}%`);
  console.log(`   Trees per Parcel: ${treesPerParcel}`);
  console.log(`   Owner: ${deployer.address}`);
  console.log("=".repeat(50));
  console.log("✅ AUTHORIZATIONS:");
  console.log(`   Marketplace -> ForestNFT: ${isNFTAuthorized}`);
  console.log(`   Marketplace -> ForestToken: ${isTokenAuthorized}`);
  console.log(`   UserRegistry -> ForestToken: ${isUserRegistryAuthorized}`);
  console.log("=".repeat(50));

  // ================================
  // 9. NEXT STEPS
  // ================================
  console.log("📝 NEXT STEPS:");
  console.log("1. Update your backend .env with the new contract addresses:");
  console.log(`   FOREST_TOKEN_ADDRESS=${forestTokenAddress}`);
  console.log(`   FOREST_NFT_ADDRESS=${forestNFTAddress}`);
  console.log(`   MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log(`   USER_CONTRACT_ADDRESS=${userRegistryAddress}`);
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
  console.log(
    `   npx hardhat verify ${userRegistryAddress} --network <network>`
  );

  // ================================
  // 10. SAVE DEPLOYMENT INFO
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
      UserRegistry: userRegistryAddress,
    },
    configuration: {
      marketplaceFee: marketplaceFee.toString(),
      treesPerParcel: treesPerParcel.toString(),
      totalUsers: finalTotalUsers.toString(),
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
