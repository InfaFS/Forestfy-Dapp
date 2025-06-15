import React from 'react';
import { StyleSheet, Image, View, Text } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { NFTContract } from "@/constants/thirdweb";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface NFTMetadata {
	name?: string;
	description?: string;
	image?: string;
	attributes?: Array<{
		trait_type: string;
		value: string | number;
	}>;
}

interface NFTItemProps {
	tokenId: bigint;
}

export function NFTItem({ tokenId }: NFTItemProps) {
	const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	// Cargar fuentes pixel
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	const { data: uriData } = useReadContract({
		contract: NFTContract,
		method: "function tokenURI(uint256 tokenId) view returns (string memory)",
		params: [tokenId],
	});

	useEffect(() => {
		async function fetchMetadata() {
			if (!uriData) return;

			try {
				setIsLoading(true);
				setError(null);
				
				// Convertir la URI de IPFS a HTTPS si es necesario
				const uri = uriData.toString();
				const httpsUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
				
				const response = await fetch(httpsUri);
				
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				
				const data = await response.json();
				setMetadata(data);

				// Procesar la URL de la imagen
				if (data.image) {
					const imageUri = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
					setImageUrl(imageUri);
				}
			} catch (err) {
				console.error('Error fetching metadata:', err);
				setError(err instanceof Error ? err.message : 'Error loading metadata');
			} finally {
				setIsLoading(false);
			}
		}

		fetchMetadata();
	}, [uriData]);

	const getRarityColor = (rarity: string) => {
		switch (rarity.toLowerCase()) {
			case 'legendary':
				return '#FFD700'; // Dorado
			case 'rare':
				return '#4169E1'; // Azul
			default:
				return '#4CAF50'; // Verde
		}
	};

	const rarity = metadata?.attributes?.find(attr => attr.trait_type.toLowerCase() === 'rarity')?.value as string;
	const rarityColor = rarity ? getRarityColor(rarity) : '#4CAF50';

	if (!fontsLoaded) {
		return null;
	}

	return (
		<ThemedView style={styles.nftContainer}>
			<View style={styles.imageContainer}>
				{imageUrl && (
					<Image 
						source={{ uri: imageUrl }} 
						style={styles.nftImage}
						resizeMode="contain"
					/>
				)}
			</View>
			<View style={styles.contentContainer}>
			{isLoading ? (
				<ThemedText style={styles.loadingText}>Loading metadata...</ThemedText>
			) : error ? (
				<ThemedText style={styles.errorText}>
					Error: {error}
				</ThemedText>
			) : metadata ? (
				<>
						<ThemedText style={styles.name}>
							{metadata.name} #{tokenId.toString()}
					</ThemedText>
						<ThemedText style={styles.description}>
							{metadata.description}
						</ThemedText>
						{rarity && (
							<View style={styles.rarityContainer}>
								<Text style={styles.rarityLabel}>Rarity: </Text>
								<Text style={[styles.rarityValue, { color: getRarityColor(rarity) }]}>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</Text>
							</View>
						)}
				</>
			) : null}
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	nftContainer: {
		padding: 15,
		borderRadius: 0,
		borderWidth: 3,
		borderColor: "#2d5016",
		marginBottom: 16,
		backgroundColor: '#fef5eb',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 2, height: 2 },
		shadowOpacity: 0.8,
		shadowRadius: 0,
		elevation: 3,
	},
	imageContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: 180,
		backgroundColor: 'rgba(74, 124, 89, 0.1)',
		borderBottomWidth: 2,
		borderBottomColor: '#2d5016',
	},
	nftImage: {
		width: '100%',
		height: '100%',
	},
	contentContainer: {
		marginTop: 195, // 180 (altura de la imagen) + 15 (espacio)
		gap: 8,
	},
	name: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#2d5016',
		lineHeight: 14,
	},
	description: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#4a7c59',
		lineHeight: 12,
	},
	rarityContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
	},
	rarityLabel: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#2d5016',
	},
	rarityValue: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		fontWeight: 'bold',
	},
	loadingText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#4a7c59',
		textAlign: 'center',
	},
	errorText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#d32f2f',
		textAlign: 'center',
		lineHeight: 12,
	},
}); 