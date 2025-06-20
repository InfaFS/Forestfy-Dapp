import React from "react";
import { View, Text, StyleSheet, Alert, Platform, StatusBar, TouchableOpacity, Image, ScrollView, DeviceEventEmitter } from "react-native";

import { ThemedButton, ThemedView, ThemedText } from "@/components/ui";
import { useState, useEffect, useCallback } from "react";
import { useReadContract, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { TokenContract, UserRegistryContract } from "@/constants/thirdweb";
import { reclaimReward, buyParcel, changeName, registerUser } from "@/constants/api";
import { useTrees } from "@/contexts/TreesContext";
import { useAlert } from "@/hooks/useAlert";
import { AlertRenderer } from "@/components/alerts/AlertRenderer";
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
	const alert = useAlert();
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

	// Verificar si el usuario está registrado
	const { data: isUserRegistered, refetch: refetchUserRegistration } = useReadContract({
		contract: UserRegistryContract,
		method: "function isUserRegistered(address) view returns (bool)",
		params: [account?.address || ""],
	});

	// Obtener información del usuario (incluyendo nombre)
	const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
		contract: UserRegistryContract,
		method: "function getUserInfo(address) view returns (string name, address userAddress, bool exists, address[] friends, uint256 createdAt)",
		params: [account?.address || ""],
		queryOptions: {
			enabled: !!account?.address && !!isUserRegistered,
		},
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
			await alert.showInfoAlert({
				title: "Error",
				message: "Please connect your wallet first",
				variant: "destructive",
				icon: "error"
			});
			return;
		}

		const confirmed = await alert.showConfirmAlert({
			title: "Claim Reward",
			message: "Are you sure you want to claim your reward?",
			confirmText: "Claim",
			cancelText: "Cancel",
			icon: "gift"
		});

		if (confirmed) {
			await handleConfirmReclaimReward();
		}
	};

	const handleConfirmReclaimReward = async () => {
		if (!account?.address) return;

		// Show loading alert
		const loadingId = alert.showLoadingAlert({
			title: "Claiming Reward",
			message: "Claiming your reward...",
			allowCancel: false
		});

		setIsLoading(true);
		try {
			await reclaimReward(account.address);
			setLocalHasClaimed(true);
			
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Reward Claimed",
				message: "Reward claimed successfully!",
				icon: "success"
			});
			
			setRefreshTrigger(prev => prev + 1);
		} catch (error: any) {
			console.error("Error al reclamar recompensa:", error);
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Error",
				message: error.message || "Could not claim the reward",
				variant: "destructive",
				icon: "error"
			});
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

		const confirmed = await alert.showConfirmAlert({
			title: "Buy Parcel",
			message: "Are you sure you want to buy a parcel for 5 tokens?",
			confirmText: "Buy Parcel",
			cancelText: "Cancel",
			variant: "success"
		});
		
		if (confirmed) {
			await handleConfirmBuyParcel();
		}
	};

	const handleConfirmBuyParcel = async () => {
		if (!account?.address) return;
		
		setIsBuyingParcel(true);
		try {
			await buyParcel(account.address);
			await alert.showInfoAlert({
				title: "You bought a new parcel!",
				variant: "success",
				icon: "success"
			});
			triggerRefresh();
		} catch (error) {
			console.error("Error buying parcel:", error);
			Alert.alert("Error", "Could not buy the parcel. Please try again.");
		} finally {
			setIsBuyingParcel(false);
		}
	};

	const handleDisconnect = async () => {
		const confirmed = await alert.showConfirmAlert({
			title: "Disconnect Wallet",
			message: "Are you sure you want to disconnect your wallet?",
			confirmText: "Disconnect",
			cancelText: "Cancel",
			destructive: true,
			variant: "error"
		});
		
		if (confirmed) {
			await handleConfirmDisconnect();
		}
	};

	const handleConfirmDisconnect = async () => {
		try {
			setIsDisconnecting(true);
			if (wallet) {
				await disconnect(wallet);
				setIsConnected(false);
				setShowToast(true);
				setToastMessage('Wallet disconnected successfully');
				setToastType('success');
			}
		} catch (error) {
			console.error('Error disconnecting wallet:', error);
			setShowToast(true);
			setToastMessage('Error disconnecting wallet');
			setToastType('error');
		} finally {
			setIsDisconnecting(false);
		}
	};

	const handleRegisterUser = async () => {
		const username = await alert.showInputAlert({
			title: "Register User",
			message: "Enter your username to register in Forestfy",
			placeholder: "Username",
			maxLength: 50,
			submitText: "Register",
			cancelText: "Cancel",
			validation: (value) => {
				if (value.length < 3) return "Username must be at least 3 characters";
				return null;
			}
		});
		
		if (username) {
			await handleConfirmRegisterUser(username);
		}
	};

	const handleChangeName = async () => {
		const currentName = userInfo && userInfo[2] ? userInfo[0] : '';
		const newName = await alert.showInputAlert({
			title: "Change Name",
			message: `Current name: ${currentName}`,
			placeholder: "New name",
			maxLength: 50,
			submitText: "Change Name",
			cancelText: "Cancel",
			validation: (value) => {
				if (value.length < 3) return "Name must be at least 3 characters";
				if (value === currentName) return "New name must be different from current name";
				return null;
			}
		});
		
		if (newName) {
			await handleConfirmChangeName(newName);
		}
	};

	const handleConfirmRegisterUser = async (username: string) => {
		if (!account?.address) {
			await alert.showInfoAlert({
				title: "Error",
				message: "Please connect your wallet first",
				variant: "destructive",
				icon: "error"
			});
			return;
		}

		// Show loading alert
		const loadingId = alert.showLoadingAlert({
			title: "Registering User",
			message: `Registering "${username}" in Forestfy...`,
			allowCancel: false
		});

		try {
			await registerUser(account.address, username);
			
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Registration Successful",
				message: `Welcome to Forestfy, ${username}!`,
				icon: "success"
			});
			
			// Refresh user data
			await refetchUserRegistration();
			setRefreshTrigger(prev => prev + 1);
			DeviceEventEmitter.emit('refreshSocialData');
		} catch (error: any) {
			console.error("Error registering user:", error);
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Registration Failed",
				message: error.message || "Could not register user. Please try again.",
				variant: "destructive",
				icon: "error"
			});
		}
	};

	const handleConfirmChangeName = async (newName: string) => {
		if (!account?.address) {
			await alert.showInfoAlert({
				title: "Error",
				message: "Please connect your wallet first",
				variant: "destructive",
				icon: "error"
			});
			return;
		}

		// Show loading alert
		const loadingId = alert.showLoadingAlert({
			title: "Changing Name",
			message: `Changing name to "${newName}"...`,
			allowCancel: false
		});

		try {
			await changeName(account.address, newName);
			
			// Refresh user info immediately
			await refetchUserInfo();
			
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Name Changed",
				message: `Name changed to "${newName}" successfully!`,
				icon: "success"
			});
			
			setRefreshTrigger(prev => prev + 1);
			DeviceEventEmitter.emit('refreshSocialData');
		} catch (error: any) {
			console.error("Error changing name:", error);
			// Hide loading alert
			alert.hideAlert(loadingId);
			
			await alert.showInfoAlert({
				title: "Error",
				message: error.message || "Could not change name. Please try again.",
				variant: "destructive",
				icon: "error"
			});
		}
	};

	// Usar el estado local o el estado del contrato
	const isClaimed = localHasClaimed || hasClaimed;

	return (
		<ThemedView style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 18, textAlign: 'center'}}>
					Config
				</ThemedText>
			</ThemedView>

			{account ? (
				<ThemedView style={styles.walletInfo}>
					{/* Show username box with change name button if registered */}
					{isUserRegistered && userInfo && userInfo[2] ? (
						<>
							<ThemedText style={styles.welcomeMessage}>
								Welcome back: {userInfo[0]}!
							</ThemedText>
							<View style={styles.userInfoContainer}>
								<TouchableOpacity
									style={styles.changeNameButton}
									onPress={handleChangeName}
								>
									<ThemedText style={styles.changeNameButtonText}>
										Change Name
									</ThemedText>
								</TouchableOpacity>
							</View>
						</>
					) : null}
					
					<TouchableOpacity
						style={[styles.customButton, styles.disconnectButton]}
						onPress={handleDisconnect}
					>
						<Image 
							source={require("@/assets/images/cerrar.png")}
							style={styles.buttonImage}
							resizeMode="contain"
						/>
						<View style={styles.textContainer}>
							<ThemedText style={styles.customButtonText}>
								Disconnect
							</ThemedText>
						</View>
					</TouchableOpacity>

					{/* Conditional buttons based on user registration */}
					{isUserRegistered ? (
						<>
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




						</>
					) : (
						/* Register Button for unregistered users */
						<TouchableOpacity
							style={[styles.customButton, styles.registerButton]}
							onPress={handleRegisterUser}
						>
							<Image 
								source={require("@/assets/images/logo.png")}
								style={styles.buttonImage}
								resizeMode="contain"
							/>
							<View style={styles.textContainer}>
								<ThemedText style={styles.customButtonText}>
									Register User
								</ThemedText>
							</View>
						</TouchableOpacity>
					)}
				</ThemedView>
			) : (
				<ThemedText type="subtext" style={styles.noWallet}>
					No wallet connected
				</ThemedText>
			)}



			{/* Alert Renderer */}
			<AlertRenderer alerts={alert._alerts} />
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
	registerButton: {
		backgroundColor: '#ff6b35', // Color diferente para destacar el registro
		borderColor: '#d4572a',
	},
	disconnectButton: {
		backgroundColor: '#7c1f1f', // Color rojo para disconnect
		borderColor: '#8b2e2e',
	},
	welcomeMessage: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		textAlign: 'center',
		marginBottom: 16,
		paddingHorizontal: 20,
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		gap: 12,
	},
	usernameBox: {
		backgroundColor: '#fef5eb',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		paddingVertical: 12,
		paddingHorizontal: 16,
		flex: 1,
		alignItems: 'center',
	},
	usernameText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: '#2d5016',
		textAlign: 'center',
	},
	changeNameButton: {
		backgroundColor: '#4a7c59',
		borderWidth: 2,
		borderColor: '#2d5016',
		borderRadius: 0,
		paddingVertical: 12,
		paddingHorizontal: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 100,
	},
	changeNameButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: 'white',
		textAlign: 'center',
	},
}); 