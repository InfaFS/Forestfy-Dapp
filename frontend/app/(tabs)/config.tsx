import { View, Text, StyleSheet, Alert, Platform, StatusBar, TouchableOpacity, Image, ScrollView } from "react-native";

import { ThemedButton } from "@/components/ThemedButton";
import { useState, useEffect, useCallback } from "react";
import { useReadContract, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { TokenContract } from "@/constants/thirdweb";
import { reclaimReward, buyParcel } from "@/constants/api";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTrees } from "@/contexts/TreesContext";
import { RewardAlert } from "@/components/RewardAlert";
import { ConfirmParcelAlert } from "@/components/ConfirmParcelAlert";
import { ConfirmDisconnectAlert } from '@/components/ConfirmDisconnectAlert';
import { router } from 'expo-router';

export default function ConfigScreen() {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const { disconnect } = useDisconnect();
	const [isLoading, setIsLoading] = useState(false);
	const [isBuyingParcel, setIsBuyingParcel] = useState(false);
	const [localHasClaimed, setLocalHasClaimed] = useState(false);
	const [tokenBalance, setTokenBalance] = useState<string>("0");
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [showRewardAlert, setShowRewardAlert] = useState(false);
	const [rewardAlertMessage, setRewardAlertMessage] = useState("");
	const [showConfirmParcelAlert, setShowConfirmParcelAlert] = useState(false);
	const [showConfirmDisconnectAlert, setShowConfirmDisconnectAlert] = useState(false);
	const [parcelAlertType, setParcelAlertType] = useState<'claim' | 'buy'>('claim');
	const [parcelAlertMessage, setParcelAlertMessage] = useState('');
	const [parcelAlertAmount, setParcelAlertAmount] = useState(0);
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<'success' | 'error'>('success');
	const { triggerRefresh } = useTrees();

	// Efecto para detectar cambios en la wallet
	useEffect(() => {
		// Wallet connection state changed
	}, [account?.address]);

	// Verificar si ya reclamó la recompensa
	const { data: hasClaimed } = useReadContract({
		contract: TokenContract,
		method: "function hasClaimedReward(address) view returns (bool)",
		params: [account?.address || ""],
	});

	// Leer el balance de tokens
	const { data: balanceData, refetch: refetchBalance } = useReadContract({
		contract: TokenContract,
		method: "function virtualBalance(address) view returns (uint256)",
		params: [account?.address || "0x0000000000000000000000000000000000000000"],
	});

	// Función para refrescar el balance
	const refreshBalance = useCallback(async () => {
		try {
			await refetchBalance();
		} catch (error) {
			console.error("Error refreshing balance:", error);
		}
	}, [refetchBalance]);

	useEffect(() => {
		if (balanceData !== undefined) {
			const balance = Number(balanceData) / 1e18;
			setTokenBalance(balance.toFixed(2));
		}
	}, [balanceData]);

	// Efecto para refrescar el balance cuando cambia el trigger
	useEffect(() => {
		if (account?.address) {
			refreshBalance();
		}
	}, [refreshTrigger, account?.address, refreshBalance]);

	const handleReclaimReward = async () => {
		if (!account?.address) {
			Alert.alert("Error", "Please connect your wallet first");
			return;
		}

		setIsLoading(true);
		try {
			await reclaimReward(account.address);
			setLocalHasClaimed(true); // Actualizar el estado local inmediatamente
			setRewardAlertMessage("Reward claimed successfully");
			setShowRewardAlert(true);
			// Refrescar el balance después de reclamar la recompensa
			setRefreshTrigger(prev => prev + 1);
		} catch (error) {
			console.error("Error al reclamar recompensa:", error);
			Alert.alert("Error", "Could not claim the reward");
		} finally {
			setIsLoading(false);
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

		setShowConfirmParcelAlert(true);
	};

	const handleConfirmBuyParcel = async () => {
		if (!account?.address) return;
		
		setIsBuyingParcel(true);
		try {
			await buyParcel(account.address);
			setRewardAlertMessage("You bought a new parcel!");
			setShowRewardAlert(true);
			// Refrescar el balance después de comprar la parcela
			triggerRefresh();
		} catch (error) {
			console.error("Error buying parcel:", error);
			Alert.alert("Error", "Could not buy the parcel. Please try again.");
		} finally {
			setIsBuyingParcel(false);
		}
	};

	const handleDisconnect = () => {
		setShowConfirmDisconnectAlert(true);
	};

	const handleConfirmDisconnect = async () => {
		try {
			await disconnect();
		} catch (error) {
			console.error('Failed to disconnect wallet:', error);
		}
	};

	const handleGoToMyNFTs = () => {
		router.push('/(screens)/my-nfts');
	};

	// Usar el estado local o el estado del contrato
	const isClaimed = localHasClaimed || hasClaimed;

	return (
		<ThemedView style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 18, textAlign: 'center'}}>
					Social
				</ThemedText>
			</ThemedView>

			{account ? (
				<ThemedView style={styles.walletInfo}>
					<ThemedText type="subtext" style={styles.walletAddress}>
						Wallet: {account.address}
					</ThemedText>
					<ThemedText type="subtext" style={styles.tokenBalance}>
						Balance: {tokenBalance} tokens
					</ThemedText>
					<ThemedButton
						title="Disconnect"
						onPress={handleDisconnect}
						variant="secondary"
						pixelFont={true}
					/>
					
					{/* Custom Claim Reward Button with OK button styling */}
					<TouchableOpacity
						style={[
							styles.customButton,
							{ opacity: (isLoading || isClaimed) ? 0.5 : 1 }
						]}
						onPress={handleReclaimReward}
						disabled={isLoading || isClaimed}
					>
						{!isClaimed && (
							<Image 
								source={require("@/assets/images/gift.png")}
								style={styles.buttonImage}
								resizeMode="contain"
							/>
						)}
						<View style={styles.textContainer}>
							<ThemedText style={styles.customButtonText}>
								{isClaimed ? "Reward Claimed" : (isLoading ? "Claiming..." : "Claim Reward")}
							</ThemedText>
						</View>
					</TouchableOpacity>

					{/* Custom Buy Parcel Button with OK button styling */}
					<TouchableOpacity
						style={[
							styles.customButton,
							{ opacity: isBuyingParcel ? 0.5 : 1 }
						]}
						onPress={handleBuyParcel}
						disabled={isBuyingParcel}
					>
						<Image 
							source={require("@/public/dirt.png")}
							style={styles.buttonImage}
							resizeMode="contain"
						/>
						<View style={styles.textContainer}>
							<ThemedText style={styles.customButtonText}>
								{isBuyingParcel ? "Buying..." : "Buy parcel"}
							</ThemedText>
						</View>
					</TouchableOpacity>

					{/* Custom My NFTs Button with OK button styling */}
					<TouchableOpacity
						style={styles.customButton}
						onPress={handleGoToMyNFTs}
					>
						<Image 
							source={require("@/assets/images/logo.png")}
							style={styles.buttonImage}
							resizeMode="contain"
						/>
						<View style={styles.textContainer}>
							<ThemedText style={styles.customButtonText}>
								My NFTs
							</ThemedText>
						</View>
					</TouchableOpacity>
				</ThemedView>
			) : (
				<ThemedText type="subtext" style={styles.noWallet}>
					No wallet connected
				</ThemedText>
			)}

			{/* Reward Alert */}
			<RewardAlert
				show={showRewardAlert}
				message={rewardAlertMessage}
				onClose={() => {
					setShowRewardAlert(false);
					setRewardAlertMessage("");
				}}
			/>

			{/* Confirm Parcel Alert */}
			<ConfirmParcelAlert
				show={showConfirmParcelAlert}
				onClose={() => setShowConfirmParcelAlert(false)}
				onConfirm={handleConfirmBuyParcel}
			/>

			<ConfirmDisconnectAlert
				show={showConfirmDisconnectAlert}
				onClose={() => setShowConfirmDisconnectAlert(false)}
				onConfirm={handleConfirmDisconnect}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 20,
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
	title: {
		marginBottom: 30,
		textAlign: 'center',
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 18,
	},
	walletInfo: {
		gap: 16,
	},
	walletAddress: {
		marginBottom: 16,
	},
	tokenBalance: {
		marginBottom: 16,
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
	},
	noWallet: {
		color: "#666",
	},
	// Custom button styles matching the OK button from focus
	customButton: {
		backgroundColor: '#4a7c59',
		borderRadius: 10,
		paddingVertical: 20,
		paddingHorizontal: 30,
		borderWidth: 2,
		borderColor: '#2d5016',
		minWidth: 280,
		alignItems: 'center',
		flexDirection: 'row',
		position: 'relative',
	},
	textContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	customButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 16,
		color: 'white',
		textAlign: 'center',
	},
	buttonImage: {
		width: 50,
		height: 50,
		position: 'absolute',
		left: 30,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#4CAF50',
		padding: 15,
		borderRadius: 10,
		marginVertical: 10,
		width: '100%',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
}); 