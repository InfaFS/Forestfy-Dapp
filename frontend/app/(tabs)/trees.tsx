import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, Animated, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedButton } from "@/components/ThemedButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { NFTContract, TokenContract } from "@/constants/thirdweb";
import { claimFirstParcel, buyParcel } from "@/constants/api";
import { useTrees } from "@/contexts/TreesContext";
import { ParcelAlert } from "@/components/ParcelAlert";

const PARCEL_IMAGES = {
	0: require("@/assets/images/parcela.png"), // Parcela vacía sin árboles
	1: require("@/assets/images/parcela_1.png"),
	2: require("@/assets/images/parcela_2.png"),
	3: require("@/assets/images/parcela_3.png"),
	4: require("@/assets/images/parcela_4.png"),
	5: require("@/assets/images/parcela_5.png"),
	6: require("@/assets/images/parcela_6.png"),
	7: require("@/assets/images/parcela_7.png"),
	8: require("@/assets/images/parcela_8.png"),
	9: require("@/assets/images/parcela_9.png"),
	10: require("@/assets/images/parcela_10.png"),
	11: require("@/assets/images/parcela_11.png"),
	12: require("@/assets/images/parcela_12.png"),
	13: require("@/assets/images/parcela_13.png"),
	14: require("@/assets/images/parcela_14.png"),
	15: require("@/assets/images/parcela_15.png"),
	16: require("@/assets/images/parcela_16.png"),
};

export default function TreesScreen() {
	const router = useRouter();
	const [nftCount, setNftCount] = useState(0);
	const [userParcels, setUserParcels] = useState(0);
	const [isClaimingParcel, setIsClaimingParcel] = useState(false);
	const [isBuyingParcel, setIsBuyingParcel] = useState(false);
	const [currentParcel, setCurrentParcel] = useState(1);
	const [tokenBalance, setTokenBalance] = useState<string>("0");
	const [showParcelAlert, setShowParcelAlert] = useState(false);
	const [parcelAlertMessage, setParcelAlertMessage] = useState("");
	const account = useActiveAccount();
	const floatAnim = useRef(new Animated.Value(0)).current;
	const { refreshTrigger, triggerRefresh } = useTrees();

	const { data, refetch: refetchNFTs } = useReadContract({
		contract: NFTContract,
		method: "function tokensOfOwner(address owner) view returns (uint256[] memory)",
		params: [account?.address || "0x0000000000000000000000000000000000000000"],
	});

	// Leer la cantidad de parcelas del usuario
	const { data: parcelData, isPending: isLoadingParcels, refetch: refetchParcels } = useReadContract({
		contract: NFTContract,
		method: "function getUserParcels(address user) view returns (uint256)",
		params: [account?.address || "0x0000000000000000000000000000000000000000"],
	});

	// Leer el balance de tokens
	const { data: balanceData } = useReadContract({
		contract: TokenContract,
		method: "function virtualBalance(address) view returns (uint256)",
		params: [account?.address || "0x0000000000000000000000000000000000000000"],
	});

	useEffect(() => {
		if (data) {
			const count = (data as bigint[]).length;
			setNftCount(count);
		}
	}, [data]);

	useEffect(() => {
		if (parcelData !== undefined) {
			const parcels = Number(parcelData);
			setUserParcels(parcels);
		}
	}, [parcelData]);

	useEffect(() => {
		if (balanceData !== undefined) {
			const balance = Number(balanceData) / 1e18;
			setTokenBalance(balance.toFixed(2));
		}
	}, [balanceData]);

	// Add effect to refetch when refreshTrigger changes
	useEffect(() => {
		refetchNFTs();
		refetchParcels();
	}, [refreshTrigger, refetchNFTs, refetchParcels]);

	useEffect(() => {
		const floatingAnimation = Animated.loop(
			Animated.sequence([
				Animated.timing(floatAnim, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true,
				}),
				Animated.timing(floatAnim, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: true,
				}),
			])
		);

		floatingAnimation.start();

		return () => {
			floatingAnimation.stop();
		};
	}, []);

	const getParcelImage = () => {
		// Calcular NFTs en la parcela actual
		const treesInCurrentParcel = getTreesInParcel(currentParcel);
		
		// Si no hay árboles en esta parcela, mostrar parcela vacía
		// Si hay árboles, mostrar la imagen correspondiente al número de árboles en esta parcela
		const imageNumber = treesInCurrentParcel === 0 ? 0 : Math.min(treesInCurrentParcel, 16);
		return PARCEL_IMAGES[imageNumber as keyof typeof PARCEL_IMAGES];
	};

	const getTreesInParcel = (parcelNumber: number) => {
		const startIndex = (parcelNumber - 1) * 16; // Índice inicial (0-based)
		const endIndex = parcelNumber * 16; // Índice final
		const treesInThisParcel = Math.max(0, Math.min(16, nftCount - startIndex));
		return treesInThisParcel;
	};

	const handleParcelNavigation = (direction: 'left' | 'right') => {
		if (userParcels > 1) {
			if (direction === 'right') {
				setCurrentParcel(prev => prev >= userParcels ? 1 : prev + 1);
			} else {
				setCurrentParcel(prev => prev <= 1 ? userParcels : prev - 1);
			}
		}
	};

	const translateY = floatAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -10],
	});

	const handleClaimFirstParcel = async () => {
		if (!account?.address) {
			Alert.alert("Error", "Please connect your wallet first");
			return;
		}

		setIsClaimingParcel(true);
		try {
			await claimFirstParcel(account.address);
			// Refrescar los datos del contrato para mostrar la nueva parcela
			triggerRefresh();
			
			setParcelAlertMessage("Parcel claimed successfully!");
			setShowParcelAlert(true);
		} catch (error) {
			console.error("Error claiming first parcel:", error);
			Alert.alert("Error", "Could not get the parcel. Please try again.");
		} finally {
			setIsClaimingParcel(false);
		}
	};

	const handleBuyParcel = async () => {
		if (!account?.address) {
			Alert.alert("Error", "Please connect your wallet first");
			return;
		}

		if (Number(tokenBalance) < 5) {
			Alert.alert("Error", "You need 5 tokens to buy a parcel");
			return;
		}

		setIsBuyingParcel(true);
		try {
			await buyParcel(account.address);
			// Refrescar los datos del contrato para mostrar la nueva parcela
			triggerRefresh();
			
			setParcelAlertMessage("You bought a new parcel!");
			setShowParcelAlert(true);
		} catch (error) {
			console.error("Error buying parcel:", error);
			Alert.alert("Error", "Could not buy the parcel. Please try again.");
		} finally {
			setIsBuyingParcel(false);
		}
	};

	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.titleContainer}>
					<ThemedText type="title" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 18, textAlign: 'center'}}>
						Forest
					</ThemedText>
				</ThemedView>
				<ThemedView style={styles.contentContainer}>
					<ThemedText type="subtitle" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 12, textAlign: 'center', marginTop: 10}}>
						Your virtual forest
					</ThemedText>
					<ThemedText type="subtext">
						Here you can view and manage all your planted trees.
					</ThemedText>
					
					{/* Información de parcelas */}
					{isLoadingParcels ? (
						<ThemedText type="subtext" style={styles.loadingText}>
							Loading parcels...
						</ThemedText>
					) : userParcels === 0 ? (
						<View style={styles.noParcelsState}>
							<Image
								source={require("@/assets/images/marchitado.png")}
								style={styles.noParcelsImage}
								resizeMode="contain"
							/>
							<ThemedText style={[styles.noParcelsText, { fontFamily: 'PressStart2P_400Regular' }]}>
								You don't have parcels :(
							</ThemedText>
							<TouchableOpacity
								style={[
									styles.customButton,
									{ opacity: isClaimingParcel ? 0.5 : 1 }
								]}
								onPress={handleClaimFirstParcel}
								disabled={isClaimingParcel}
							>
								<View style={styles.textContainer}>
									<ThemedText style={styles.customButtonText}>
										{isClaimingParcel ? "Getting..." : "Claim a parcel for free!"}
									</ThemedText>
								</View>
							</TouchableOpacity>
						</View>
					) : (
						<>
							{/* Información de parcelas */}
							{userParcels > 1 ? (
								<ThemedText type="subtext" style={styles.currentParcelInfo}>
									Parcel {currentParcel}/{userParcels} | Trees: {getTreesInParcel(currentParcel)}/16
								</ThemedText>
							) : (
								<ThemedText type="subtext" style={styles.parcelInfo}>
									Parcels: {userParcels} | Trees: {nftCount}/{userParcels * 16}
								</ThemedText>
							)}
							
							{/* Siempre mostrar la imagen de la parcela cuando hay parcelas */}
							<TouchableOpacity 
								style={styles.imageContainer}
								onPress={() => {
									const treesInParcel = getTreesInParcel(currentParcel);
									if (treesInParcel > 0) {
										// Navegar con información de la parcela actual
										router.navigate({
											pathname: "/(screens)/user-nfts",
											params: { 
												parcel: currentParcel.toString(),
												startIndex: ((currentParcel - 1) * 16).toString(),
												endIndex: (currentParcel * 16).toString()
											}
										});
									}
								}}
								activeOpacity={getTreesInParcel(currentParcel) > 0 ? 0.7 : 1}
							>
								<Animated.Image 
									source={getParcelImage()} 
									style={[styles.image, { transform: [{ translateY }] }]}
									resizeMode="contain"
								/>
							</TouchableOpacity>
							
							{/* Flechitas para navegar entre parcelas */}
							{userParcels > 1 && (
								<View style={styles.parcelNavContainer}>
									<TouchableOpacity 
										style={styles.arrowButton}
										onPress={() => handleParcelNavigation('left')}
									>
										<ThemedText style={styles.arrowText}>←</ThemedText>
									</TouchableOpacity>
									
									<ThemedText style={styles.parcelNavText}>
										{currentParcel} / {userParcels}
									</ThemedText>
									
									<TouchableOpacity 
										style={styles.arrowButton}
										onPress={() => handleParcelNavigation('right')}
									>
										<ThemedText style={styles.arrowText}>→</ThemedText>
									</TouchableOpacity>
								</View>
							)}
							
							{/* Mostrar texto adicional si no hay árboles en la parcela actual */}
							{getTreesInParcel(currentParcel) === 0 && (
								<ThemedText type="subtext" style={styles.emptyText}>
									{userParcels > 1 ? `Parcel ${currentParcel} is ready to plant trees` : "Your parcel is ready to plant trees"}
								</ThemedText>
							)}
						</>
					)}
				</ThemedView>
			</ThemedView>

			{/* Parcel Alert */}
			<ParcelAlert
				show={showParcelAlert}
				message={parcelAlertMessage}
				onClose={() => {
					setShowParcelAlert(false);
					setParcelAlertMessage("");
				}}
			/>
		</ProtectedRoute>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 20,
		justifyContent: 'center',
		marginTop: 40,
		marginBottom: 20,
	},
	contentContainer: {
		padding: 20,
		gap: 16,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	imageContainer: {
		width: "100%",
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	image: {
		width: "80%",
		height: "80%",
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		textAlign: 'center',
		color: '#666',
	},
	loadingText: {
		textAlign: 'center',
		color: '#666',
		marginVertical: 20,
	},
	noParcelsState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	noParcelsImage: {
		width: 120,
		height: 120,
		marginBottom: 20,
	},
	noParcelsText: {
		textAlign: 'center',
		fontSize: 14,
		marginBottom: 20,
	},
	parcelInfo: {
		textAlign: 'center',
		color: '#4CAF50',
		fontSize: 14,
		fontWeight: 'bold',
		backgroundColor: 'rgba(76, 175, 80, 0.1)',
		padding: 10,
		borderRadius: 8,
		marginVertical: 10,
	},
	claimButton: {
		marginTop: 20,
		backgroundColor: '#4CAF50',
		borderRadius: 0,
		borderWidth: 2,
		borderColor: '#2E7D32',
	},
	currentParcelInfo: {
		textAlign: 'center',
		color: '#2E7D32',
		fontSize: 12,
		fontWeight: 'bold',
		backgroundColor: 'rgba(46, 125, 50, 0.1)',
		padding: 8,
		borderRadius: 6,
		marginVertical: 5,
	},
	parcelNavButton: {
		marginTop: 15,
		borderRadius: 0,
		borderWidth: 2,
	},
	parcelNavContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 15,
		gap: 20,
	},
	arrowButton: {
		backgroundColor: 'rgba(46, 125, 50, 0.1)',
		borderWidth: 2,
		borderColor: '#2E7D32',
		borderRadius: 0,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	arrowText: {
		fontSize: 20,
		color: '#2E7D32',
		fontWeight: 'bold',
	},
	parcelNavText: {
		fontSize: 14,
		color: '#2E7D32',
		fontWeight: 'bold',
		fontFamily: 'PressStart2P_400Regular',
	},
	buyParcelContainer: {
		marginTop: 20,
		alignItems: 'center',
		gap: 10,
	},
	buyParcelText: {
		fontSize: 12,
		textAlign: 'center',
	},
	buyParcelButton: {
		width: 200,
	},
	customButton: {
		backgroundColor: '#4a7c59',
		borderRadius: 10,
		paddingVertical: 15,
		paddingHorizontal: 25,
		borderWidth: 2,
		borderColor: '#2d5016',
		minWidth: 240,
		alignItems: 'center',
		justifyContent: 'center',
	},
	textContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	customButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: 'white',
		textAlign: 'center',
	},
}); 