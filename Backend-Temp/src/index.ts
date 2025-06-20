import express, { Request, Response, Router, RequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import {
  ForestNFTAbi,
  ForestTokenAbi,
  FrestMarketplaceAbi,
  UserRegistryAbi,
} from "./abis/abi";
import path from "path";

// Configurar dotenv con la ruta absoluta al archivo .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const router = Router();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Initialize both contracts
const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS!,
  ForestNFTAbi,
  wallet
);

const tokenContract = new ethers.Contract(
  process.env.TOKEN_CONTRACT_ADDRESS!,
  ForestTokenAbi,
  wallet
);

const marketplaceContract = new ethers.Contract(
  process.env.MARKETPLACE_CONTRACT_ADDRESS!,
  FrestMarketplaceAbi,
  wallet
);

const userRegistryContract = new ethers.Contract(
  process.env.USER_CONTRACT_ADDRESS!,
  UserRegistryAbi,
  wallet
);

// Helper function to validate address and amount
const validateMintRequest = (address: string, amount: number) => {
  if (!address) {
    return { valid: false, error: "Address is required" };
  }
  if (!amount || amount <= 0) {
    return { valid: false, error: "Valid amount is required" };
  }
  return { valid: true };
};

// Helper function to check virtual balance
const checkVirtualBalance = async (address: string, amount: string) => {
  const amountInWei = ethers.parseUnits(amount, 18);
  const virtualBalance = await tokenContract.virtualBalance(address);

  if (virtualBalance < amountInWei) {
    return {
      sufficient: false,
      currentBalance: ethers.formatUnits(virtualBalance, 18),
      requiredAmount: amount,
    };
  }

  return { sufficient: true, amountInWei };
};

router.post("/mint", async (req: Request, res: Response) => {
  console.log("📥 New mint request received");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Validation error:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    console.log("🎨 Minting NFT...");
    const mintAmount = Math.round(amount * 10);
    console.log(`📊 Amount to mint: ${mintAmount}`);
    const mintTx = await nftContract.mintTo(address, mintAmount);
    await mintTx.wait();
    console.log("✅ NFT minted successfully");

    res.json({
      success: true,
      mintHash: mintTx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/reclaim-reward", async (req: Request, res: Response) => {
  console.log("📥 New reclaim reward request received");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Check if user has already claimed reward
    const hasClaimedReward = await tokenContract.hasClaimedReward(address);
    if (hasClaimedReward) {
      console.log("❌ User already claimed their initial reward");
      res.status(400).json({ error: "Initial reward already claimed" });
      return;
    }

    console.log("🎁 Claiming initial reward...");
    const tx = await tokenContract.claimInitialReward(address);
    await tx.wait();
    console.log("✅ Reward claimed successfully");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  console.log("📥 New withdraw request received");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Validation error:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    // Check virtual balance
    const balanceCheck = await checkVirtualBalance(address, amount.toString());
    if (!balanceCheck.sufficient) {
      console.log("❌ Insufficient balance");
      res.status(400).json({
        error: "Insufficient balance",
        currentBalance: balanceCheck.currentBalance,
        requiredAmount: balanceCheck.requiredAmount,
      });
      return;
    }

    console.log("💸 Executing withdraw...");
    const tx = await tokenContract.withdraw(address, balanceCheck.amountInWei);
    await tx.wait();
    console.log("✅ Withdraw completed successfully");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/reduce-balance", async (req: Request, res: Response) => {
  console.log("📥 New reduce balance request received");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Validation error:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    console.log("💸 Executing reduce balance...");
    const tx = await tokenContract.reduceBalance(address, amountInWei);
    await tx.wait();
    console.log("✅ Reduce balance completed successfully");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/claim-staking", async (req: Request, res: Response) => {
  console.log("📥 New claim staking request received");

  try {
    const { address, amount } = req.body;

    // Validate request
    const validation = validateMintRequest(address, amount);
    if (!validation.valid) {
      console.log("❌ Validation error:", validation.error);
      res.status(400).json({ error: validation.error });
      return;
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    console.log("🎁 Executing claim staking...");
    const tx = await tokenContract.claimStaking(address, amountInWei);
    await tx.wait();
    console.log("✅ Claim staking completed successfully");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-parcel", async (req: Request, res: Response) => {
  console.log("📥 New add parcel request received");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Verificar que el usuario tenga al menos 5 tokens virtuales
    const virtualBalance = await tokenContract.virtualBalance(address);
    const requiredAmount = ethers.parseUnits("5", 18); // 5 tokens

    if (virtualBalance < requiredAmount) {
      console.log("❌ Insufficient balance to buy parcel");
      res.status(400).json({
        error: "Insufficient balance to buy parcel",
        required: "5",
        current: ethers.formatUnits(virtualBalance, 18),
      });
      return;
    }

    console.log("💸 Reducing 5 tokens from balance...");
    const reduceTx = await tokenContract.reduceBalance(address, requiredAmount);
    await reduceTx.wait();
    console.log("✅ Tokens reduced successfully");

    console.log("🏞️ Adding parcel...");
    const addTx = await nftContract.addParcels(address, 1);
    await addTx.wait();
    console.log("✅ Parcel added successfully");

    res.json({
      success: true,
      reduceHash: reduceTx.hash,
      addParcelHash: addTx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/claim-first-parcel", async (req: Request, res: Response) => {
  console.log("📥 New claim first parcel request received");

  try {
    const { address } = req.body;

    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Check if user already has parcels using userParcels mapping
    const userParcels = await nftContract.userParcels(address);
    if (userParcels > 0) {
      console.log("❌ User already has parcels");
      res.status(400).json({ error: "User already has parcels" });
      return;
    }

    console.log("🏞️ Adding parcel...");
    const tx = await nftContract.addParcels(address, 1);
    await tx.wait();
    console.log("✅ Parcel added successfully");

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/list-nft", async (req: Request, res: Response) => {
  console.log("📥 New list NFT request received");

  try {
    const { address, tokenId, precio } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID not provided");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    if (!precio || precio <= 0) {
      console.log("❌ Error: Invalid price");
      res.status(400).json({ error: "Valid price is required" });
      return;
    }

    // Convertir precio a Wei (asumimos que el precio está en tokens)
    const priceInWei = ethers.parseUnits(precio.toString(), 18);

    console.log(`🏷️ Listing NFT on marketplace...`);
    console.log(`📍 Address: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);
    console.log(`💰 Price: ${precio} tokens`);

    // Llamar al método listNFT del contrato Marketplace
    const tx = await marketplaceContract.listNFT(address, tokenId, priceInWei);
    await tx.wait();

    console.log("✅ NFT listed successfully on marketplace");

    res.json({
      success: true,
      hash: tx.hash,
      seller: address,
      tokenId: tokenId,
      price: precio,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/unlist-nft", async (req: Request, res: Response) => {
  console.log("📥 New unlist NFT request received");

  try {
    const { address, tokenId } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID not provided");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    console.log(`🚫 Removing NFT from marketplace...`);
    console.log(`📍 Address: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);

    // Llamar al método unlistNFT del contrato Marketplace
    const tx = await marketplaceContract.unlistNFT(address, tokenId);
    await tx.wait();

    console.log("✅ NFT removed successfully from marketplace");

    res.json({
      success: true,
      hash: tx.hash,
      seller: address,
      tokenId: tokenId,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-listings/:address", async (req: Request, res: Response) => {
  console.log("📥 New request to get user listings");

  try {
    const { address } = req.params;

    // Validar que el address esté presente
    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // Validar formato de address (básico)
    if (!ethers.isAddress(address)) {
      console.log("❌ Error: Invalid address");
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    console.log(`🔍 Getting listings for address: ${address}`);

    // Obtener los tokenIds listados por el usuario
    const userTokenIds = await marketplaceContract.getUserListings(address);
    console.log(`📋 Token IDs found: ${userTokenIds.length}`);

    if (userTokenIds.length === 0) {
      console.log("📭 No listings found for this user");
      res.json({
        success: true,
        address: address,
        listings: [],
        totalListings: 0,
      });
      return;
    }

    // Obtener detalles de cada listing
    const listings = [];
    for (const tokenId of userTokenIds) {
      try {
        const listing = await marketplaceContract.getListing(tokenId);

        // Solo incluir listings activos
        if (listing.isActive) {
          listings.push({
            tokenId: listing.tokenId.toString(),
            seller: listing.seller,
            price: ethers.formatUnits(listing.price, 18), // Convertir de Wei a tokens
            priceWei: listing.price.toString(),
            isActive: listing.isActive,
            listedAt: listing.listedAt.toString(),
            listedAtDate: new Date(
              Number(listing.listedAt) * 1000
            ).toISOString(),
          });
        }
      } catch (error) {
        console.log(`⚠️ Error getting details for token ${tokenId}:`, error);
        // Continuar con el siguiente token en caso de error
      }
    }

    console.log(`✅ Active listings found: ${listings.length}`);

    res.json({
      success: true,
      address: address,
      listings: listings,
      totalListings: listings.length,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/buy-nft", async (req: Request, res: Response) => {
  console.log("📥 New NFT purchase request received");

  try {
    const { address, tokenId } = req.body;

    // Validar que todos los parámetros requeridos estén presentes
    if (!address) {
      console.log("❌ Error: Address not provided");
      res.status(400).json({ error: "Buyer address is required" });
      return;
    }

    if (!tokenId && tokenId !== 0) {
      console.log("❌ Error: Token ID not provided");
      res.status(400).json({ error: "Token ID is required" });
      return;
    }

    // Validar formato de address
    if (!ethers.isAddress(address)) {
      console.log("❌ Error: Invalid address");
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    console.log(`🛒 Buying NFT...`);
    console.log(`👤 Buyer: ${address}`);
    console.log(`🏷️ Token ID: ${tokenId}`);

    // Obtener detalles del listing antes de la compra para logs
    try {
      const listing = await marketplaceContract.getListing(tokenId);
      if (!listing.isActive) {
        console.log("❌ Error: NFT is not listed");
        res.status(400).json({ error: "NFT is not listed for sale" });
        return;
      }

      const listingPriceInTokens = ethers.formatUnits(listing.price, 18);
      console.log(`💰 Price: ${listingPriceInTokens} tokens`);
      console.log(`👨‍💼 Seller: ${listing.seller}`);

      // Verificar que el comprador no sea el vendedor
      if (listing.seller.toLowerCase() === address.toLowerCase()) {
        console.log("❌ Error: Cannot buy own NFT");
        res.status(400).json({ error: "Cannot buy your own NFT" });
        return;
      }

      // Verificar que el comprador tenga espacio disponible en sus parcelas
      const userParcels = await nftContract.getUserParcels(address);
      const currentTrees = await nftContract.getUserTokenCount(address);
      const treesPerParcel = 16; // TREES_PER_PARCEL constante del contrato
      const maxTreesAllowed = userParcels * treesPerParcel;

      console.log(`🏞️ Buyer's parcels: ${userParcels}`);
      console.log(`🌳 Current trees: ${currentTrees}`);
      console.log(`📊 Maximum allowed: ${maxTreesAllowed}`);

      if (currentTrees >= maxTreesAllowed) {
        console.log("❌ Error: Buyer has no space in their parcels");
        res.status(400).json({
          error: "Not enough parcel space to buy this NFT",
          currentTrees: currentTrees.toString(),
          maxTreesAllowed: maxTreesAllowed.toString(),
          userParcels: userParcels.toString(),
        });
        return;
      }

      // Verificar que el comprador tenga fondos suficientes
      const buyerBalance = await tokenContract.virtualBalance(address);
      const priceInTokens = ethers.formatUnits(listing.price, 18);
      const balanceInTokens = ethers.formatUnits(buyerBalance, 18);

      console.log(`💰 NFT price: ${priceInTokens} tokens`);
      console.log(`🏦 Buyer's balance: ${balanceInTokens} tokens`);

      if (buyerBalance < listing.price) {
        console.log("❌ Error: Insufficient funds to buy the NFT");
        res.status(400).json({
          error: "Insufficient token balance to buy this NFT",
          required: priceInTokens,
          current: balanceInTokens,
          shortfall: ethers.formatUnits(listing.price - buyerBalance, 18),
        });
        return;
      }

      // Llamar al método buyNFT del contrato Marketplace
      const tx = await marketplaceContract.buyNFT(address, tokenId);
      await tx.wait();

      console.log("✅ NFT purchased successfully");

      res.json({
        success: true,
        hash: tx.hash,
        buyer: address,
        seller: listing.seller,
        tokenId: tokenId,
        price: listingPriceInTokens,
        priceWei: listing.price.toString(),
      });
    } catch (listingError: any) {
      console.log("❌ Error getting listing details:", listingError.message);

      // Intentar la compra de todas formas, por si el error es solo de consulta
      try {
        const tx = await marketplaceContract.buyNFT(address, tokenId);
        await tx.wait();

        console.log("✅ NFT purchased successfully (without previous details)");

        res.json({
          success: true,
          hash: tx.hash,
          buyer: address,
          tokenId: tokenId,
        });
      } catch (buyError: any) {
        throw buyError; // Re-lanzar el error de compra
      }
    }
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Insufficient token balance")) {
      errorMessage = "Insufficient token balance to buy this NFT";
    } else if (err.message.includes("Listing not active")) {
      errorMessage = "NFT is not listed for sale";
    } else if (err.message.includes("Cannot buy your own NFT")) {
      errorMessage = "Cannot buy your own NFT";
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Métodos administrativos para gestión de usuarios

router.post("/register-user", async (req: Request, res: Response) => {
  console.log("📥 New administrative user registration request received");

  try {
    const { userAddress, name } = req.body;

    // Validar parámetros
    if (!userAddress) {
      console.log("❌ Error: userAddress not provided");
      res.status(400).json({ error: "User address is required" });
      return;
    }

    if (!name) {
      console.log("❌ Error: name not provided");
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Validar formato de address
    if (!ethers.isAddress(userAddress)) {
      console.log("❌ Error: Invalid address");
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    console.log(`👤 Registering user: ${userAddress}`);
    console.log(`📝 Name: ${name}`);

    // Llamar al método registerUserAdmin del contrato
    const tx = await userRegistryContract.registerUserAdmin(userAddress, name);
    await tx.wait();

    console.log("✅ User registered successfully");

    res.json({
      success: true,
      hash: tx.hash,
      userAddress: userAddress,
      name: name,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario ya registrado")) {
      errorMessage = "User already registered";
    } else if (err.message.includes("Nombre ya tomado")) {
      errorMessage = "Name already taken";
    } else if (err.message.includes("Nombre no puede estar vacio")) {
      errorMessage = "Name cannot be empty";
    } else if (err.message.includes("Nombre demasiado largo")) {
      errorMessage = "Name too long (max 50 characters)";
    }

    res.status(500).json({ error: errorMessage });
  }
});

router.post("/send-friend-request", async (req: Request, res: Response) => {
  console.log("📥 New administrative send friend request received");

  try {
    const { fromAddress, toAddress } = req.body;

    // Validar parámetros
    if (!fromAddress) {
      console.log("❌ Error: fromAddress not provided");
      res.status(400).json({ error: "From address is required" });
      return;
    }

    if (!toAddress) {
      console.log("❌ Error: toAddress not provided");
      res.status(400).json({ error: "To address is required" });
      return;
    }

    // Validar formato de addresses
    if (!ethers.isAddress(fromAddress)) {
      console.log("❌ Error: Invalid fromAddress");
      res.status(400).json({ error: "Invalid from address format" });
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      console.log("❌ Error: Invalid toAddress");
      res.status(400).json({ error: "Invalid to address format" });
      return;
    }

    console.log(`👤 From: ${fromAddress}`);
    console.log(`📤 Sending request to: ${toAddress}`);

    // Llamar al método sendFriendRequestAdmin del contrato
    const tx = await userRegistryContract.sendFriendRequestAdmin(
      fromAddress,
      toAddress
    );
    await tx.wait();

    console.log("✅ Friend request sent successfully");

    res.json({
      success: true,
      hash: tx.hash,
      fromAddress: fromAddress,
      toAddress: toAddress,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario no registrado")) {
      errorMessage = "User not registered";
    } else if (
      err.message.includes("No puedes enviarte solicitud a ti mismo")
    ) {
      errorMessage = "Cannot send friend request to yourself";
    } else if (err.message.includes("Ya es tu amigo")) {
      errorMessage = "Already friends";
    } else if (err.message.includes("Ya enviaste solicitud a este usuario")) {
      errorMessage = "Friend request already sent";
    }

    res.status(500).json({ error: errorMessage });
  }
});

router.post("/accept-friend-request", async (req: Request, res: Response) => {
  console.log("📥 New administrative accept friend request received");

  try {
    const { fromAddress, toAddress } = req.body;

    // Validar parámetros
    if (!fromAddress) {
      console.log("❌ Error: fromAddress not provided");
      res.status(400).json({ error: "From address is required" });
      return;
    }

    if (!toAddress) {
      console.log("❌ Error: toAddress not provided");
      res.status(400).json({ error: "To address is required" });
      return;
    }

    // Validar formato de addresses
    if (!ethers.isAddress(fromAddress)) {
      console.log("❌ Error: Invalid fromAddress");
      res.status(400).json({ error: "Invalid from address format" });
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      console.log("❌ Error: Invalid toAddress");
      res.status(400).json({ error: "Invalid to address format" });
      return;
    }

    console.log(`👤 From: ${fromAddress}`);
    console.log(`✅ Accepting request for: ${toAddress}`);

    // Llamar al método acceptFriendRequestAdmin del contrato
    const tx = await userRegistryContract.acceptFriendRequestAdmin(
      fromAddress,
      toAddress
    );
    await tx.wait();

    console.log("✅ Friend request accepted successfully");

    res.json({
      success: true,
      hash: tx.hash,
      fromAddress: fromAddress,
      toAddress: toAddress,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario no registrado")) {
      errorMessage = "User not registered";
    } else if (err.message.includes("No hay solicitud de este usuario")) {
      errorMessage = "No friend request from this user";
    } else if (err.message.includes("Ya es tu amigo")) {
      errorMessage = "Already friends";
    }

    res.status(500).json({ error: errorMessage });
  }
});

router.post("/change-name", async (req: Request, res: Response) => {
  console.log("📥 New administrative name change request received");

  try {
    const { userAddress, newName } = req.body;

    // Validar parámetros
    if (!userAddress) {
      console.log("❌ Error: userAddress not provided");
      res.status(400).json({ error: "User address is required" });
      return;
    }

    if (!newName) {
      console.log("❌ Error: newName not provided");
      res.status(400).json({ error: "New name is required" });
      return;
    }

    // Validar formato de address
    if (!ethers.isAddress(userAddress)) {
      console.log("❌ Error: Invalid userAddress");
      res.status(400).json({ error: "Invalid user address format" });
      return;
    }

    // Validar longitud del nombre
    if (newName.length === 0) {
      console.log("❌ Error: Empty name");
      res.status(400).json({ error: "Name cannot be empty" });
      return;
    }

    if (newName.length > 50) {
      console.log("❌ Error: Name too long");
      res.status(400).json({ error: "Name too long (max 50 characters)" });
      return;
    }

    console.log(`👤 User: ${userAddress}`);
    console.log(`📝 New name: ${newName}`);

    // Llamar al método changeNameAdmin del contrato
    const tx = await userRegistryContract.changeNameAdmin(userAddress, newName);
    await tx.wait();

    console.log("✅ Name changed successfully");

    res.json({
      success: true,
      hash: tx.hash,
      userAddress: userAddress,
      newName: newName,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario no registrado")) {
      errorMessage = "User not registered";
    } else if (err.message.includes("Nombre ya tomado")) {
      errorMessage = "Name already taken";
    } else if (err.message.includes("Nombre no puede estar vacio")) {
      errorMessage = "Name cannot be empty";
    } else if (err.message.includes("Nombre demasiado largo")) {
      errorMessage = "Name too long (max 50 characters)";
    } else if (err.message.includes("ForestToken no configurado")) {
      errorMessage = "ForestToken not configured";
    }

    res.status(500).json({ error: errorMessage });
  }
});

router.post("/remove-friend", async (req: Request, res: Response) => {
  console.log("📥 New administrative remove friend request received");

  try {
    const { userAddress, friendAddress } = req.body;

    // Validar parámetros
    if (!userAddress) {
      console.log("❌ Error: userAddress not provided");
      res.status(400).json({ error: "User address is required" });
      return;
    }

    if (!friendAddress) {
      console.log("❌ Error: friendAddress not provided");
      res.status(400).json({ error: "Friend address is required" });
      return;
    }

    // Validar formato de addresses
    if (!ethers.isAddress(userAddress)) {
      console.log("❌ Error: Invalid userAddress");
      res.status(400).json({ error: "Invalid user address format" });
      return;
    }

    if (!ethers.isAddress(friendAddress)) {
      console.log("❌ Error: Invalid friendAddress");
      res.status(400).json({ error: "Invalid friend address format" });
      return;
    }

    console.log(`👤 User: ${userAddress}`);
    console.log(`👥 Removing friend: ${friendAddress}`);

    // Llamar al método removeFriendAdmin del contrato
    const tx = await userRegistryContract.removeFriendAdmin(
      userAddress,
      friendAddress
    );
    await tx.wait();

    console.log("✅ Friend removed successfully");

    res.json({
      success: true,
      hash: tx.hash,
      userAddress: userAddress,
      friendAddress: friendAddress,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario no registrado")) {
      errorMessage = "User not registered";
    } else if (err.message.includes("No es tu amigo")) {
      errorMessage = "Not friends";
    }

    res.status(500).json({ error: errorMessage });
  }
});

router.post("/cancel-friend-request", async (req: Request, res: Response) => {
  console.log("📥 New administrative cancel friend request received");

  try {
    const { fromAddress, toAddress } = req.body;

    // Validar parámetros
    if (!fromAddress) {
      console.log("❌ Error: fromAddress not provided");
      res.status(400).json({ error: "From address is required" });
      return;
    }

    if (!toAddress) {
      console.log("❌ Error: toAddress not provided");
      res.status(400).json({ error: "To address is required" });
      return;
    }

    // Validar formato de addresses
    if (!ethers.isAddress(fromAddress)) {
      console.log("❌ Error: Invalid fromAddress");
      res.status(400).json({ error: "Invalid from address format" });
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      console.log("❌ Error: Invalid toAddress");
      res.status(400).json({ error: "Invalid to address format" });
      return;
    }

    console.log(`👤 From: ${fromAddress}`);
    console.log(`❌ Canceling request for: ${toAddress}`);

    // Llamar al método cancelFriendRequestAdmin del contrato
    const tx = await userRegistryContract.cancelFriendRequestAdmin(
      fromAddress,
      toAddress
    );
    await tx.wait();

    console.log("✅ Friend request canceled successfully");

    res.json({
      success: true,
      hash: tx.hash,
      fromAddress: fromAddress,
      toAddress: toAddress,
    });
  } catch (err: any) {
    console.log("❌ Error:", err.message);

    // Proporcionar mensajes de error más específicos
    let errorMessage = err.message;
    if (err.message.includes("Usuario no registrado")) {
      errorMessage = "User not registered";
    } else if (
      err.message.includes("No hay solicitud de este usuario a cancelar")
    ) {
      errorMessage = "No friend request to cancel";
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
