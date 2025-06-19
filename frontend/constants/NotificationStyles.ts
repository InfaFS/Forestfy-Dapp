export const NOTIFICATION_STYLES = {
  // Colores principales del tema
  backgroundColor: "#fef5eb",
  borderColor: "#2d5016",
  textColor: "#2d5016",
  subtextColor: "#4a7c59",

  // Colores específicos por tipo
  success: {
    backgroundColor: "#fef5eb",
    borderColor: "#4a7c59",
  },
  error: {
    backgroundColor: "#fef5eb",
    borderColor: "#d32f2f",
  },
  info: {
    backgroundColor: "#fef5eb",
    borderColor: "#2d5016",
  },

  // Configuraciones comunes
  borderRadius: 0,
  borderWidth: 3,
  shadow: {
    color: "#000",
    offset: { width: 2, height: 2 },
    opacity: 0.8,
    radius: 0,
  },
  elevation: 5,

  // Tipografía
  fonts: {
    title: {
      fontFamily: "PressStart2P_400Regular",
      fontSize: 12,
      lineHeight: 16,
    },
    message: {
      fontFamily: "PressStart2P_400Regular",
      fontSize: 10,
      lineHeight: 14,
    },
    button: {
      fontFamily: "PressStart2P_400Regular",
      fontSize: 8,
    },
  },

  // Dimensiones
  logo: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },

  // Duraciones por defecto
  durations: {
    short: 2000,
    medium: 3000,
    long: 4000,
  },
};

export const NOTIFICATION_MESSAGES = {
  nftSold: {
    title: "NFT Sold Successfully!",
    getMessage: (tokenId: string, price: string) =>
      `Tree #${tokenId} sold for ${price} FTK`,
  },
  nftPurchased: {
    title: "NFT Purchased Successfully!",
    getMessage: (tokenId: string, price: string) =>
      `Tree #${tokenId} purchased for ${price} FTK`,
  },
  friendRequestReceived: {
    title: "New Friend Request!",
    getMessage: (fromUserName: string) =>
      `${fromUserName} wants to be your friend`,
  },
  friendRequestAccepted: {
    title: "Friend Request Accepted!",
    getMessage: (toUserName: string) =>
      `${toUserName} accepted your friend request`,
  },
  error: {
    title: "Error",
    message: "Something went wrong",
  },
};
