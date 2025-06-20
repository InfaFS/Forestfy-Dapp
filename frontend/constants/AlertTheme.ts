import { Easing } from "react-native";
import { AlertTheme } from "@/types/alerts";

export const defaultAlertTheme: AlertTheme = {
  colors: {
    background: "#fef5eb",
    border: "#2d5016",
    text: "#2d5016",
    textSecondary: "#4a7c59",
    primary: "#4a7c59",
    secondary: "#fef5eb",
    success: "#4a7c59",
    error: "#d32f2f",
    warning: "#f57c00",
    info: "#1976d2",
  },
  fonts: {
    primary: "PressStart2P_400Regular",
    sizes: {
      title: 12,
      message: 10,
      button: 8,
      input: 10,
    },
  },
  spacing: {
    padding: 35,
    margin: 40,
    buttonGap: 12,
  },
  animation: {
    duration: 300,
    easing: Easing.out(Easing.ease),
  },
};

// Variantes de color según el tipo
export const getVariantColors = (variant?: string) => {
  const theme = defaultAlertTheme;

  switch (variant) {
    case "success":
      return {
        primary: theme.colors.success,
        secondary: theme.colors.background,
        text: theme.colors.text,
      };
    case "error":
      return {
        primary: theme.colors.error,
        secondary: theme.colors.background,
        text: theme.colors.text,
      };
    case "warning":
      return {
        primary: theme.colors.warning,
        secondary: theme.colors.background,
        text: theme.colors.text,
      };
    case "info":
      return {
        primary: theme.colors.info,
        secondary: theme.colors.background,
        text: theme.colors.text,
      };
    default:
      return {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        text: theme.colors.text,
      };
  }
};

// Iconos según el tipo
export const getIconSource = (icon?: string) => {
  switch (icon) {
    case "success":
    case "tree":
      return require("@/assets/images/logo.png"); // Usar logo para éxito/árbol
    case "error":
      return require("@/assets/images/cerrar.png");
    case "warning":
      return require("@/assets/images/clock_1.png");
    case "info":
      return require("@/assets/images/logo.png");
    case "coin":
      return require("@/assets/images/coin.png");
    case "nft":
      return require("@/assets/images/gift.png");
    case "logo":
    default:
      return require("@/assets/images/logo.png");
  }
};

// Specific themes for different app sections
export const focusAlertTheme = {
  ...defaultAlertTheme,
  animation: {
    duration: 300,
    easing: "ease-out" as const,
  },
  positioning: {
    top: "40%",
    paddingHorizontal: 20,
  },
  styling: {
    backgroundColor: "#fef5eb",
    borderColor: "#2d5016",
    borderWidth: 3,
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: "90%",
  },
  typography: {
    title: {
      fontSize: 12,
      fontFamily: "PressStart2P_400Regular",
      color: "#2d5016",
      lineHeight: 16,
      textAlign: "center" as const,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 10,
      fontFamily: "PressStart2P_400Regular",
      color: "#4a7c59",
      lineHeight: 14,
      textAlign: "center" as const,
      marginBottom: 20,
    },
  },
  buttons: {
    gap: 15,
    button: {
      borderRadius: 0,
      borderWidth: 2,
      borderColor: "#2d5016",
      paddingVertical: 10,
      paddingHorizontal: 20,
      minWidth: 100,
      alignItems: "center" as const,
    },
    confirm: {
      backgroundColor: "#4a7c59",
    },
    cancel: {
      backgroundColor: "#fef5eb",
    },
    destructive: {
      backgroundColor: "#d32f2f",
    },
    text: {
      fontSize: 8,
      fontFamily: "PressStart2P_400Regular",
      color: "#2d5016",
    },
  },
};

export const friendsAlertTheme = {
  ...defaultAlertTheme,
  animation: {
    duration: 300,
    easing: "ease-out" as const,
  },
  positioning: {
    top: "30%",
    paddingHorizontal: 40,
  },
  styling: {
    backgroundColor: "#fef5eb",
    borderColor: "#2d5016",
    borderWidth: 3,
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: "90%",
  },
  typography: {
    title: {
      fontSize: 12,
      fontFamily: "PressStart2P_400Regular",
      color: "#2d5016",
      lineHeight: 16,
      textAlign: "center" as const,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 10,
      fontFamily: "PressStart2P_400Regular",
      color: "#4a7c59",
      lineHeight: 14,
      textAlign: "center" as const,
      marginBottom: 20,
    },
  },
  buttons: {
    gap: 15,
    button: {
      borderRadius: 0,
      borderWidth: 2,
      borderColor: "#2d5016",
      paddingVertical: 10,
      paddingHorizontal: 20,
      minWidth: 100,
      alignItems: "center" as const,
    },
    confirm: {
      backgroundColor: "#4a7c59",
    },
    cancel: {
      backgroundColor: "#fef5eb",
    },
    destructive: {
      backgroundColor: "#d32f2f",
    },
    text: {
      fontSize: 8,
      fontFamily: "PressStart2P_400Regular",
      color: "#2d5016",
    },
  },
};

export const sessionLostTheme = {
  ...defaultAlertTheme,
  animation: {
    duration: 300,
    easing: "ease-out" as const,
  },
  positioning: {
    top: "40%",
    paddingHorizontal: 20,
  },
  styling: {
    backgroundColor: "#ffebee",
    borderColor: "#d32f2f",
    borderWidth: 3,
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: "90%",
  },
  typography: {
    title: {
      fontSize: 12,
      fontFamily: "PressStart2P_400Regular",
      color: "#d32f2f",
      lineHeight: 16,
      textAlign: "center" as const,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 10,
      fontFamily: "PressStart2P_400Regular",
      color: "#d32f2f",
      lineHeight: 14,
      textAlign: "center" as const,
      marginBottom: 20,
    },
  },
  buttons: {
    gap: 15,
    button: {
      borderRadius: 0,
      borderWidth: 2,
      borderColor: "#d32f2f",
      paddingVertical: 10,
      paddingHorizontal: 20,
      minWidth: 100,
      alignItems: "center" as const,
    },
    confirm: {
      backgroundColor: "#d32f2f",
    },
    cancel: {
      backgroundColor: "#ffebee",
    },
    destructive: {
      backgroundColor: "#d32f2f",
    },
    text: {
      fontSize: 8,
      fontFamily: "PressStart2P_400Regular",
      color: "#d32f2f",
    },
  },
};
