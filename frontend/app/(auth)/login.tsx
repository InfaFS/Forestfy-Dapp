import React from "react";
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { ThemedText, ThemedView } from "@/components/ui";
import { useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { useAuth } from "@/hooks/useAuth";
import { client, mantleSepoliaTestnet } from "@/constants/thirdweb";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

export default function LoginScreen() {
	const { connect, isConnecting } = useConnect();
	const { isAuthenticated, redirectToMain } = useAuth();
	
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	// Si ya está conectado, redirigir a la página principal
	React.useEffect(() => {
		if (isAuthenticated) {
			redirectToMain();
		}
	}, [isAuthenticated, redirectToMain]);

	// Mostrar loading hasta que las fuentes se carguen
	if (!fontsLoaded) {
		return (
			<ThemedView style={styles.container}>
				<ThemedView style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#4a7c59" />
				</ThemedView>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.contentContainer}>
				<Image 
					source={require("@/assets/images/logo.png")}
					style={styles.logo}
					resizeMode="contain"
				/>
				<ThemedText type="title" style={styles.title}>
					Welcome to Forestfy
				</ThemedText>
				<ThemedText type="subtext" style={styles.subtitle}>
					Connect your wallet to access all features
				</ThemedText>

				<ThemedView style={styles.buttonContainer}>
					<TouchableOpacity
						style={[
							styles.googleButton,
							{ opacity: isConnecting ? 0.5 : 1 }
						]}
						disabled={isConnecting}
						onPress={() => {
							connect(async () => {
								const w = inAppWallet({ 		
									auth: {
										options: ["google"],
									},
									smartAccount: {										
										chain: mantleSepoliaTestnet,
										sponsorGas: true,
									},
								});
								await w.connect({
									client,
									strategy: "google",
								});
								return w;
							});
						}}
					>
						{isConnecting && (
							<ActivityIndicator animating={isConnecting} color="#333" />
						)}
						<Image 
							source={require("@/assets/images/google.png")}
							style={styles.googleImage}
							resizeMode="contain"
						/>
						<ThemedText type="defaultSemiBold" style={styles.googleText}>
							{isConnecting ? "Connecting..." : "Connect with Google"}
						</ThemedText>
					</TouchableOpacity>
				</ThemedView>
			</ThemedView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
	},
	contentContainer: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	logo: {
		width: 120,
		height: 120,
		marginBottom: 20,
	},
	title: {
		fontSize: 18,
		marginBottom: 10,
		textAlign: "center",
		fontFamily: 'PressStart2P_400Regular',
		lineHeight: 24,
		paddingHorizontal: 10,
	},
	subtitle: {
		textAlign: "center",
		marginBottom: 30,
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		lineHeight: 16,
		paddingHorizontal: 20,
	},
	buttonContainer: {
		width: "100%",
		maxWidth: 300,
		gap: 12,
		alignItems: "center",
	},
	button: {
		width: "100%",
		height: 50,
		borderRadius: 25,
	},
	googleButton: {
		width: "100%",
		height: 50,
		borderRadius: 25,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		borderWidth: 2,
		borderColor: "#000",
		gap: 12,
	},
	googleImage: {
		width: 30,
		height: 30,
	},
	googleText: {
		color: "#333",
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		lineHeight: 16,
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
}); 