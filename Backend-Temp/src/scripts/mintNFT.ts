// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log("❌ Usage: ts-node mintNFT.ts <address> <amount>");
  process.exit(1);
}

const [address, amount] = args;
const numberOfNFTs = Number(amount);

try {
  console.log(`🎨 Starting mint of ${numberOfNFTs} NFTs...`);

  for (let i = 0; i < numberOfNFTs; i++) {
    console.log(`\n📦 Minting NFT #${i + 1}...`);
    const mintAmount = 15; // Valor fijo dentro del rango permitido (1.2-6.5)
    console.log(`📊 Amount to mint: ${mintAmount}`);
    const mintTx = await nftContract.mintTo(address, mintAmount);
    await mintTx.wait();
    console.log(`✅ NFT #${i + 1} minted successfully`);
    console.log(`📝 Transaction hash: ${mintTx.hash}`);
  }

  console.log("\n✨ Process completed successfully");
  console.log(`📊 Total NFTs minted: ${numberOfNFTs}`);
} catch (error: any) {
  console.log("❌ Error:", error.message);
  process.exit(1);
}
