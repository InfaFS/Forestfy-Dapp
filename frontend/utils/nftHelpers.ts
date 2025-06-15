export const formatTokenAmount = (amount: string | number): string => {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;

  // Si es muy pequeño (notación científica), convertir desde wei
  if (numAmount < 0.001 && numAmount > 0) {
    const fromWei = numAmount * 1e18;
    return fromWei.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // Para números normales, formatear con decimales apropiados
  return numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatPrice = (price: bigint) => {
  const numPrice = Number(price) / 1e18;
  return formatTokenAmount(numPrice);
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
