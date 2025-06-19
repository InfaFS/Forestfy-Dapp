import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, Animated, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useReadContract } from "thirdweb/react";
import { NFTContract } from "@/constants/thirdweb";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { Ionicons } from "@expo/vector-icons";

const PARCEL_IMAGES = {
	0: require("@/assets/images/parcela.png"),
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

export default function FriendForestScreen() {
	const router = useRouter();
	const { friendAddress, friendName } = useLocalSearchParams<{
		friendAddress: string;
		friendName: string;
	}>();
	
	const [nftCount, setNftCount] = useState(0);
	const [userParcels, setUserParcels] = useState(0);
	const [currentParcel, setCurrentParcel] = useState(1);
	const floatAnim = useRef(new Animated.Value(0)).current;

	// Cargar fuentes pixel
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	const { data: nftData } = useReadContract({
		contract: NFTContract,
		method: "function tokensOfOwner(address owner) view returns (uint256[] memory)",
		params: [friendAddress || "0x0000000000000000000000000000000000000000"],
		queryOptions: {
			enabled: !!friendAddress,
		},
	});

	// Leer la cantidad de parcelas del amigo
	const { data: parcelData, isPending: isLoadingParcels } = useReadContract({
		contract: NFTContract,
		method: "function getUserParcels(address user) view returns (uint256)",
		params: [friendAddress || "0x0000000000000000000000000000000000000000"],
		queryOptions: {
			enabled: !!friendAddress,
		},
	});

	useEffect(() => {
		if (nftData) {
			const count = (nftData as bigint[]).length;
			setNftCount(count);
		}
	}, [nftData]);

	useEffect(() => {
		if (parcelData !== undefined) {
			const parcels = Number(parcelData);
			setUserParcels(parcels);
		}
	}, [parcelData]);

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

	const handleViewNFTs = () => {
		const treesInParcel = getTreesInParcel(currentParcel);
		if (treesInParcel > 0) {
			// Navegar a una vista de NFTs específica para el amigo
			router.push({
				pathname: "/(screens)/friend-nfts",
				params: { 
					friendAddress: friendAddress,
					friendName: friendName,
					parcel: currentParcel.toString(),
					startIndex: ((currentParcel - 1) * 16).toString(),
					endIndex: (currentParcel * 16).toString()
				}
			});
		}
	};

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
						{friendName}'s Forest
					</ThemedText>
				</ThemedView>

				<ThemedView style={styles.contentContainer}>
					<ThemedText type="subtitle" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 12, textAlign: 'center', marginTop: 10}}>
						{friendName}'s virtual forest
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
								{friendName} doesn't have parcels yet :(
							</ThemedText>
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
								onPress={handleViewNFTs}
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
									{userParcels > 1 ? `Parcel ${currentParcel} is empty` : `${friendName}'s parcel is empty`}
								</ThemedText>
							)}
						</>
					)}
				</ThemedView>
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
		fontSize: 16,
		color: '#2d5016',
		flex: 1,
		textAlign: 'center',
		marginRight: 56, // Para centrar el texto
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
	parcelNavContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
		gap: 20,
	},
	arrowButton: {
		padding: 10,
		backgroundColor: '#4a7c59',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		minWidth: 50,
		alignItems: 'center',
	},
	arrowText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 16,
		color: '#fff',
	},
	parcelNavText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
	},
	viewNFTsButton: {
		marginTop: 20,
		backgroundColor: '#4a7c59',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		paddingVertical: 12,
		paddingHorizontal: 20,
	},
	viewNFTsButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#fff',
		textAlign: 'center',
	},
}); 