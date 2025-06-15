import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "react-native";
import { Colors } from "../constants/Colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TreesProvider } from "@/contexts/TreesContext";
import { MarketplaceProvider } from "@/contexts/MarketplaceContext";

import { NotificationDisplay } from "@/components/NotificationDisplay";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const colorScheme = useColorScheme();
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		const inAuthGroup = segments[0] === "(auth)";

		if (!isAuthenticated && !inAuthGroup) {
			// Redirigir a login si no hay cuenta y no estamos en auth
			router.replace("/(auth)/login");
		} else if (isAuthenticated && inAuthGroup) {
			// Redirigir a la página principal si hay cuenta y estamos en auth
			router.replace("/(tabs)/focus");
		}
	}, [isAuthenticated, segments[0]]);

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<StatusBar
				backgroundColor={Colors[colorScheme ?? "light"].background}
				barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
			/>
			
			<NotificationDisplay />
			<Stack
				screenOptions={{
					animation: "slide_from_bottom",
					animationDuration: 200,
					contentStyle: {
						backgroundColor: Colors[colorScheme ?? "light"].background,
					},
					headerShown: false,
				}}
			>
				<Stack.Screen 
					name="(auth)" 
					options={{ 
						headerShown: false,
					}} 
				/>
				<Stack.Screen 
					name="(tabs)" 
					options={{ 
						headerShown: false,
					}} 
				/>
				<Stack.Screen 
					name="(screens)" 
					options={{ 
						headerShown: false,
					}} 
				/>
				<Stack.Screen 
					name="+not-found" 
					options={{
						headerShown: false,
					}}
				/>
			</Stack>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		PressStart2P: PressStart2P_400Regular,
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ThirdwebProvider>
			<AuthProvider>
				<WalletProvider>
					<NotificationProvider>
						<TreesProvider>
							<MarketplaceProvider>
							<RootLayoutNav />
							</MarketplaceProvider>
						</TreesProvider>
					</NotificationProvider>
				</WalletProvider>
			</AuthProvider>
		</ThirdwebProvider>
	);
}
