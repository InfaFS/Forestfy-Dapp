import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const clientId = "b3dd74f4d2ae890b10e48bba408c2642";
const secretKey =
  "NMUG7p47DUpxv0h6gMMHoPoTW0O2WWnAHamSq3tPU6vvtByK45hJJe3vd-JOdHriXSVX4b7KyeWrfkWyyx3lIQ";

const nftContractAddress = "0x61cf4F0A843256232f5AfdF71624330ae4f482BF";
const tokenContractAddress = "0xD4277725fe89Cc65CFeddF7cAe8546a067D1f2d6";
const marketplaceContractAddress =
  "0xb6e7FF72f6753ac8BA0e3567a957364af7eB09B0";
if (!clientId) {
  throw new Error(
    "Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID - make sure to set it in your .env file"
  );
}

if (!secretKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_THIRDWEB_SECRET_KEY - make sure to set it in your .env file"
  );
}

if (!nftContractAddress) {
  throw new Error(
    "Missing EXPO_PUBLIC_NFT_CONTRACT_ADDRESS - make sure to set it in your .env file"
  );
}

if (!tokenContractAddress) {
  throw new Error(
    "Missing EXPO_PUBLIC_TOKEN_CONTRACT_ADDRESS - make sure to set it in your .env file"
  );
}

if (!marketplaceContractAddress) {
  throw new Error(
    "Missing EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS - make sure to set it in your .env file"
  );
}

export const client = createThirdwebClient({
  clientId,
  secretKey,
});

export const mantleSepoliaTestnet = defineChain({
  id: 5003,
  name: "Mantle Sepolia Testnet",
  rpc: "https://rpc.sepolia.mantle.xyz",
  nativeCurrency: {
    name: "Mantle Sepolia",
    symbol: "MNT",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Mantle Explorer",
      url: "https://explorer.sepolia.mantle.xyz",
    },
  ],
  testnet: true,
});

// connect to your contract
export const NFTContract = getContract({
  client,
  chain: mantleSepoliaTestnet,
  address: nftContractAddress,
});

export const TokenContract = getContract({
  client,
  chain: mantleSepoliaTestnet,
  address: tokenContractAddress,
});

export const MarketplaceContract = getContract({
  client,
  chain: mantleSepoliaTestnet,
  address: marketplaceContractAddress,
});
