import React from 'react';
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NFTList } from "@/components/nfts/NFTList";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

export default function UserNFTsScreen() {
	const router = useRouter();

	// Cargar fuentes pixel
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	if (!fontsLoaded) {
		return null;
	}

	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.header}>
					<TouchableOpacity 
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<ThemedText style={styles.backButtonText}>←</ThemedText>
					</TouchableOpacity>
					<ThemedText style={styles.title}>
						My NFTs
					</ThemedText>
				</ThemedView>
				<NFTList />
			</ThemedView>
		</ProtectedRoute>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fef5eb',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
		borderBottomWidth: 2,
		borderBottomColor: '#2d5016',
		backgroundColor: '#fef5eb',
	},
	backButton: {
		marginRight: 16,
		padding: 8,
		backgroundColor: '#4a7c59',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		minWidth: 40,
		alignItems: 'center',
	},
	backButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 16,
		color: '#fff',
	},
	title: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 18,
		color: '#2d5016',
	},
}); 