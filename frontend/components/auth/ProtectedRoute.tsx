import React from "react";
import { useActiveAccount } from "thirdweb/react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedButton } from "./ThemedButton";
import { useConnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client } from "@/constants/thirdweb";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnect();

  if (!account) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
} 