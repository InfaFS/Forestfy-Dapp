import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting UserRegistry deployment...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);
  console.log(
    `💰 Account balance: ${ethers.formatEther(
      await deployer.provider.getBalance(deployer.address)
    )} ETH\n`
  );

  // ================================
  // 1. DEPLOY USER REGISTRY
  // ================================
  console.log("1️⃣ Deploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`✅ UserRegistry deployed to: ${userRegistryAddress}`);

  // ================================
  // 2. VERIFICATION
  // ================================
  console.log("2️⃣ Verifying deployment...");

  // Check contract owner
  const owner = await userRegistry.owner();
  console.log(`   👑 Contract Owner: ${owner}`);

  // Check initial state
  const totalUsers = await userRegistry.getTotalUsers();
  console.log(`   👥 Total Users: ${totalUsers}`);

  // Test basic functionality
  console.log("   🧪 Testing basic functionality...");

  // Check if a random name is available
  const testName = "TestUser";
  const isNameAvailable = await userRegistry.isNameAvailable(testName);
  console.log(`   📝 Name "${testName}" available: ${isNameAvailable}`);

  // Check if deployer is registered
  const isDeployerRegistered = await userRegistry.isUserRegistered(
    deployer.address
  );
  console.log(`   ✅ Deployer registered: ${isDeployerRegistered}\n`);

  // ================================
  // 3. OPTIONAL INITIAL SETUP
  // ================================
  console.log("3️⃣ Optional initial setup...");

  // Register the deployer as the first user for testing
  console.log("   👤 Registering deployer as first user...");
  try {
    const registerTx = await userRegistry.registerUser("Admin");
    await registerTx.wait();
    console.log("   ✅ Deployer registered successfully");

    // Verify registration
    const [name, userAddress, exists, friends, createdAt] =
      await userRegistry.getUserInfo(deployer.address);
    console.log(`   📋 User Info:`);
    console.log(`      Name: ${name}`);
    console.log(`      Address: ${userAddress}`);
    console.log(`      Exists: ${exists}`);
    console.log(`      Friends: ${friends.length}`);
    console.log(
      `      Created At: ${new Date(Number(createdAt) * 1000).toISOString()}`
    );
  } catch (error: any) {
    console.log(`   ⚠️ Note: ${error.message}`);
  }

  const finalTotalUsers = await userRegistry.getTotalUsers();
  console.log(`   👥 Final Total Users: ${finalTotalUsers}\n`);

  // ================================
  // 4. DEPLOYMENT SUMMARY
  // ================================
  console.log("🎉 USER REGISTRY DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("📋 CONTRACT ADDRESS:");
  console.log(`   UserRegistry: ${userRegistryAddress}`);
  console.log("=".repeat(50));
  console.log("⚙️  CONFIGURATION:");
  console.log(`   Owner: ${owner}`);
  console.log(`   Total Users: ${finalTotalUsers}`);
  console.log("=".repeat(50));

  // ================================
  // 5. NEXT STEPS
  // ================================
  console.log("📝 NEXT STEPS:");
  console.log("1. Update your backend .env with the new contract address:");
  console.log(`   USER_CONTRACT_ADDRESS=${userRegistryAddress}`);
  console.log("");
  console.log("2. Update your frontend configuration with the new address");
  console.log("");
  console.log("3. Test the contract:");
  console.log("   - Register users");
  console.log("   - Add/remove friends");
  console.log("   - Test admin functions");
  console.log("");
  console.log("4. Verify contract on block explorer (if needed):");
  console.log(
    `   npx hardhat verify ${userRegistryAddress} --network <network>`
  );
  console.log("");

  // ================================
  // 6. SAVE DEPLOYMENT INFO
  // ================================
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      UserRegistry: userRegistryAddress,
    },
    configuration: {
      owner: owner,
      totalUsers: finalTotalUsers.toString(),
    },
  };

  console.log("💾 DEPLOYMENT INFO (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
