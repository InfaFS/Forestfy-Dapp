export const formatPrice = (price: bigint) => {
  return (Number(price) / 1e18).toFixed(2);
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case "legendary":
      return "#FFD700"; // Dorado
    case "rare":
      return "#4169E1"; // Azul
    default:
      return "#4CAF50"; // Verde
  }
};

export const formatDate = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
};

export const extractRarity = (
  attributes?: Array<{ trait_type: string; value: string | number }>
) => {
  return attributes?.find((attr) => attr.trait_type.toLowerCase() === "rarity")
    ?.value as string;
};
