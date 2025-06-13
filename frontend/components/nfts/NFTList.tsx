import React from 'react';
import { StyleSheet, ScrollView, Image, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { NFTContract } from "@/constants/thirdweb";
import { NFTItem } from "./NFTItem";
import { useLocalSearchParams } from "expo-router";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface NFT {
	tokenId: bigint;
}

export function NFTList() {
	const [nfts, setNfts] = useState<NFT[]>([]);
	const account = useActiveAccount();
	const params = useLocalSearchParams();
	const startIndex = Number(params.startIndex) || 0;
	const endIndex = Number(params.endIndex) || 16;

	// Cargar fuentes pixel
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	const { data, isPending } = useReadContract({
		contract: NFTContract,
		method: "function tokensOfOwner(address owner) view returns (uint256[] memory)",
		params: [account?.address || "0x0000000000000000000000000000000000000000"],
	});

	useEffect(() => {
		if (data) {
			const allNFTs = (data as bigint[]).map(tokenId => ({
				tokenId
			}));
			
			// Filtrar NFTs para mostrar solo los de la parcela actual
			const parcelNFTs = allNFTs.slice(startIndex, endIndex);
			setNfts(parcelNFTs);
		}
	}, [data, startIndex, endIndex]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<ScrollView 
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={true}
		>
			<ThemedText style={styles.parcelTitle}>Parcel {Number(params.parcel)} NFTs</ThemedText>
			{isPending ? (
				<ThemedView style={styles.loadingContainer}>
					<ThemedText style={styles.loadingText}>Loading NFTs...</ThemedText>
				</ThemedView>
			) : nfts.length === 0 ? (
				<View style={styles.emptyState}>
					<Image
						source={require("@/assets/images/marchitado.png")}
						style={styles.witheredImage}
						resizeMode="contain"
					/>
					<ThemedText style={styles.emptyText}>
						No NFTs in this parcel
					</ThemedText>
				</View>
			) : (
				nfts.map((nft, index) => (
					<NFTItem key={index} tokenId={nft.tokenId} />
				))
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: '#fef5eb',
	},
	scrollContent: {
		padding: 20,
		gap: 16,
	},
	parcelTitle: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		textAlign: 'center',
		marginBottom: 20,
		padding: 15,
		backgroundColor: 'rgba(74, 124, 89, 0.1)',
		borderWidth: 2,
		borderColor: '#4a7c59',
		borderRadius: 0,
	},
	loadingContainer: {
		backgroundColor: '#fef5eb',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		padding: 20,
		alignItems: 'center',
	},
	loadingText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#4a7c59',
		textAlign: 'center',
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
		backgroundColor: '#fef5eb',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		padding: 20,
	},
	witheredImage: {
		width: 120,
		height: 120,
		marginBottom: 16,
	},
	emptyText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		textAlign: 'center',
		color: '#4a7c59',
		lineHeight: 14,
	},
}); 