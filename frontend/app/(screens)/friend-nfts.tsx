import React from 'react';
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { FriendNFTList } from "@/components/nfts/FriendNFTList";

export default function FriendNFTsScreen() {
	const router = useRouter();
	const { friendAddress, friendName, parcel, startIndex, endIndex } = useLocalSearchParams<{
		friendAddress: string;
		friendName: string;
		parcel?: string;
		startIndex?: string;
		endIndex?: string;
	}>();

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
						{friendName}'s NFTs
						{parcel && ` - Parcel ${parcel}`}
					</ThemedText>
				</ThemedView>
				<FriendNFTList 
					friendAddress={friendAddress || ""}
					parcel={parcel ? parseInt(parcel) : undefined}
					startIndex={startIndex ? parseInt(startIndex) : undefined}
					endIndex={endIndex ? parseInt(endIndex) : undefined}
				/>
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
		fontSize: 14,
		color: '#2d5016',
		flex: 1,
		textAlign: 'center',
		marginRight: 56, // Para centrar el texto
	},
}); 