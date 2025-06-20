import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar, TextInput, Animated, Easing, Text, Modal, Pressable, Alert, AppState } from "react-native";
import { ThemedText, ThemedView, ThemedButton } from "@/components/ui";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { mintTree, reduceBalance, claimStaking } from "@/constants/api";
import { readContract } from "thirdweb";
import { TokenContract, NFTContract } from "@/constants/thirdweb";
import { LoadingAnimation, CoinAnimation, ClockAnimation } from "@/components/animations";
import { MysteryTree, MysteryTreeRef } from "@/components/forest";
import { useAlert } from "@/hooks/useAlert";
import { AlertRenderer } from "@/components/alerts/AlertRenderer";
import { ProtectedRoute } from "@/components/auth";
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useTrees } from "@/contexts/TreesContext";
import { DeviceEventEmitter } from 'react-native';

// Componente TimeSlider personalizado
const TimeSlider: React.FC<{
	value: number;
	onValueChange: (value: number) => void;
	minimumValue?: number;
	maximumValue?: number;
	step?: number;
}> = ({
	value,
	onValueChange,
	minimumValue = 5,
	maximumValue = 15,
	step = 1,
}) => {
	const SLIDER_WIDTH = 260;
	const SEGMENT_COUNT = Math.floor((maximumValue - minimumValue) / step) + 1;
	
	const handleSegmentPress = (index: number) => {
		const newValue = minimumValue + (index * step);
		onValueChange(Math.min(Math.max(newValue, minimumValue), maximumValue));
	};

	const currentProgress = (value - minimumValue) / (maximumValue - minimumValue);
	const activeSegments = Math.round(currentProgress * (SEGMENT_COUNT - 1));

	return (
		<View style={timeSliderStyles.container}>
			<View style={timeSliderStyles.sliderContainer}>
				{/* Pista pixelada con segmentos */}
				<View style={timeSliderStyles.trackBackground}>
					{Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
						<TouchableOpacity
							key={index}
							style={[
								timeSliderStyles.trackSegment,
								{
									backgroundColor: index <= activeSegments ? '#2d5016' : '#c0c0c0',
								}
							]}
							onPress={() => handleSegmentPress(index)}
							activeOpacity={0.8}
						/>
					))}
				</View>
				
				{/* Bolita (thumb) */}
				<View 
					style={[
						timeSliderStyles.thumb,
						{
							left: (currentProgress * (SLIDER_WIDTH - 16)) + 8,
						}
					]}
				>
					<View style={timeSliderStyles.thumbInner} />
				</View>
			</View>
			
			{/* Mostrar valor actual */}
			<ThemedText style={timeSliderStyles.valueText}>
				{value}s
			</ThemedText>
		</View>
	);
};

const timeSliderStyles = StyleSheet.create({
	container: {
		alignItems: 'center',
		paddingVertical: 15,
	},
	sliderContainer: {
		width: 260,
		height: 30,
		position: 'relative',
		justifyContent: 'center',
		marginBottom: 10,
	},
	trackBackground: {
		position: 'absolute',
		top: '50%',
		left: 0,
		right: 0,
		height: 10,
		flexDirection: 'row',
		borderWidth: 2,
		borderColor: '#2d5016',
		transform: [{ translateY: -5 }],
		backgroundColor: '#c0c0c0',
	},
	trackSegment: {
		flex: 1,
		height: '100%',
		borderRightWidth: 1,
		borderRightColor: '#2d5016',
		marginHorizontal: 0,
	},
	thumb: {
		position: 'absolute',
		top: '50%',
		width: 16,
		height: 16,
		transform: [{ translateY: -8 }, { translateX: -8 }],
		justifyContent: 'center',
		alignItems: 'center',
	},
	thumbInner: {
		width: 14,
		height: 14,
		backgroundColor: '#2d5016',
		borderWidth: 2,
		borderColor: '#1a3009',
		borderRadius: 0,
		shadowColor: '#000',
		shadowOffset: {
			width: 1,
			height: 1,
		},
		shadowOpacity: 0.8,
		shadowRadius: 0,
		elevation: 3,
	},
	valueText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		textAlign: 'center',
	},
});

export default function FocusScreen() {
	const account = useActiveAccount();
	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isMintingNFT, setIsMintingNFT] = useState(false);
	const [isProcessingTokens, setIsProcessingTokens] = useState(false);
	const alert = useAlert();
	const [success, setSuccess] = useState<string | null>(null);
	const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
	const [tokenBalance, setTokenBalance] = useState<string>("0");
	const [timerActive, setTimerActive] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [selectedTimer, setSelectedTimer] = useState<number | null>(null);
	const [sliderValue, setSliderValue] = useState(5); // Nuevo estado para el slider
	const [timerCompleted, setTimerCompleted] = useState(false);
	const [potentialReward, setPotentialReward] = useState<number | null>(null);
	const [selectedAction, setSelectedAction] = useState<'tokens' | 'nft' | null>(null);
	const [showStakeModal, setShowStakeModal] = useState(false);
	const [showEarnings, setShowEarnings] = useState(false);
	const [hasParcel, setHasParcel] = useState(false);
	const mysteryTreeRef = useRef<MysteryTreeRef>(null);
	const { triggerRefresh } = useTrees();
	const [isTimerRunning, setIsTimerRunning] = useState(false);
	const [timeLeft, setTimeLeft] = useState(0);
	const [tokensToInvest, setTokensToInvest] = useState(1);
	const [isInvesting, setIsInvesting] = useState(false);
	const [rewardAlertType, setRewardAlertType] = useState<'tokens' | 'mint'>('tokens');
	const [rewardAmount, setRewardAmount] = useState(0);
	const [lostTokensAmount, setLostTokensAmount] = useState("");
	
	// Estados para manejo de AppState y contador de abandono
	const [appState, setAppState] = useState(AppState.currentState);
	const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
	const [abandonmentCountdown, setAbandonmentCountdown] = useState<number | null>(null);
	const [isShowingAbandonmentWarning, setIsShowingAbandonmentWarning] = useState(false);
	const [abandonmentStartTime, setAbandonmentStartTime] = useState<number | null>(null);
	const abandonmentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Cargar fuentes
	const [fontsLoaded] = useFonts({
		PressStart2P_400Regular,
	});

	// Verificar si el usuario tiene parcelas
	const { data: parcelData } = useReadContract({
		contract: NFTContract,
		method: "function getUserParcels(address user) view returns (uint256)",
		params: [account?.address || ""],
		queryOptions: {
			enabled: !!account?.address,
		},
	});



	useEffect(() => {
		if (parcelData !== undefined) {
			setHasParcel(Number(parcelData) > 0);
		}
	}, [parcelData]);

	const fetchBalance = useCallback(async () => {
		if (account?.address) {
			try {
				const data = await readContract({
					contract: TokenContract,
					method: "function virtualBalance(address) view returns (uint256)",
					params: [account.address],
				});
				// Convertir el balance de wei a tokens (asumiendo 18 decimales)
				const balance = Number(data) / 1e18;
				setTokenBalance(balance.toFixed(2));
				setHasEnoughTokens(true);
			} catch (error) {
				console.error("Error fetching balance:", error);
			}
		}
	}, [account?.address]);

	// Función para actualizar el balance usando DeviceEventEmitter con reintentos
	const updateBalance = useCallback(() => {
		console.log('🔄 Actualizando balance en Focus...');
		// Actualización inmediata
		DeviceEventEmitter.emit('refreshWalletData');
		
		// Reintento después de 1 segundo
		setTimeout(() => {
			console.log('🔄 Reintento 1 - Actualizando balance...');
			DeviceEventEmitter.emit('refreshWalletData');
		}, 1000);
		
		// Reintento después de 3 segundos
		setTimeout(() => {
			console.log('🔄 Reintento 2 - Actualizando balance...');
			DeviceEventEmitter.emit('refreshWalletData');
		}, 3000);
		
		// Actualización local también
		setTimeout(() => {
			fetchBalance();
		}, 1500);
	}, [fetchBalance]);

	useEffect(() => {
		fetchBalance();
		// Actualizar el balance cada 60 segundos (reducido de 30)
		const interval = setInterval(fetchBalance, 60000);
		return () => clearInterval(interval);
	}, [fetchBalance]);

	// Functions to handle app abandonment
	const handleAppStateChange = useCallback((nextAppState: 'active' | 'background' | 'inactive' | 'unknown' | 'extension') => {
		console.log('📱 AppState changed from', appState, 'to', nextAppState);
		
		// If timer is active and app leaves active state
		const shouldPauseTimer = timerActive && appState === 'active' && nextAppState !== 'active' && pausedTimeRemaining === null;
		
		if (shouldPauseTimer) {
			console.log('⏸️ App left active state, pausing timer');
			// Pausar el timer principal
			if (focusTimerRef.current) {
				clearInterval(focusTimerRef.current);
				focusTimerRef.current = null;
			}
			
			// Guardar el tiempo restante
			setPausedTimeRemaining(timeRemaining);
			
			// Start abandonment timer based on timestamp
			const startTime = Date.now();
			console.log('🚨 Starting 10s abandonment timer');
			setAbandonmentStartTime(startTime);
			setAbandonmentCountdown(10);
			setIsShowingAbandonmentWarning(true);
			
			// Clear previous timer if exists
			if (abandonmentTimerRef.current) {
				clearInterval(abandonmentTimerRef.current);
			}
			
			abandonmentTimerRef.current = setInterval(() => {
				const elapsedTime = Date.now() - startTime;
				const remainingTime = Math.max(0, 10000 - elapsedTime);
				const remainingSeconds = Math.ceil(remainingTime / 1000);
				
				console.log(`⏰ Abandonment timer: ${remainingSeconds}s remaining`);
				
				if (remainingTime <= 0) {
					console.log('⏰ Abandonment timer: 0s - Executing session loss');
					handleAbandonSession();
				} else {
					setAbandonmentCountdown(remainingSeconds);
				}
			}, 1000);
		}
		
		// If app returns to foreground and there's a paused timer
		if (nextAppState === 'active' && pausedTimeRemaining !== null && pausedTimeRemaining > 0) {
			console.log('▶️ App returned to foreground');
			
			// Check if 10 seconds have already passed
			if (abandonmentStartTime) {
				const elapsedTime = Date.now() - abandonmentStartTime;
				
				if (elapsedTime >= 10000) {
					console.log('⚠️ More than 10 seconds away, executing session abandonment');
					handleAbandonSession();
					return;
				}
			}
			
			// Cancel abandonment counter if it still exists
			if (abandonmentTimerRef.current) {
				clearInterval(abandonmentTimerRef.current);
				abandonmentTimerRef.current = null;
			}
			
			// Clear abandonment warning state
			setAbandonmentCountdown(null);
			setIsShowingAbandonmentWarning(false);
			setAbandonmentStartTime(null);
			
					// Show resume alert instead of automatically resuming
		alert.showConfirmAlert({
			title: "Resume Timer",
			message: "Do you want to resume your focus session?",
			confirmText: "Resume",
			cancelText: "Cancel",
			variant: "success"
		}).then((confirmed) => {
			if (confirmed) {
				handleResumeTimer();
			}
		});
		}
		
		// If app returns to foreground but no paused timer (session lost)
		if (nextAppState === 'active' && pausedTimeRemaining === null && !timerActive && !timerCompleted) {
			// Ensure everything is clean
			setAbandonmentCountdown(null);
			setIsShowingAbandonmentWarning(false);
		}
		
		setAppState(nextAppState);
	}, [appState, timerActive, timeRemaining, pausedTimeRemaining]);

	const checkAbandonmentTime = useCallback(() => {
		if (abandonmentStartTime) {
			const elapsedTime = Date.now() - abandonmentStartTime;
			const remainingTime = Math.max(0, 10000 - elapsedTime); // 10 segundos en ms
			const remainingSeconds = Math.ceil(remainingTime / 1000);
			
			console.log(`🕐 Tiempo transcurrido: ${elapsedTime}ms, restante: ${remainingSeconds}s`);
			
			if (remainingTime <= 0) {
				return true; // Tiempo agotado
			}
			
			setAbandonmentCountdown(remainingSeconds);
			return false;
		}
		return false;
	}, [abandonmentStartTime]);

	const handleAbandonSession = useCallback(() => {
		console.log('❌ Session abandoned, losing tokens');
		
		// Save tokens amount before reset
		setLostTokensAmount(inputValue);
		
		// Clear all timers immediately
		if (focusTimerRef.current) {
			clearInterval(focusTimerRef.current);
			focusTimerRef.current = null;
		}
		if (abandonmentTimerRef.current) {
			clearInterval(abandonmentTimerRef.current);
			abandonmentTimerRef.current = null;
		}
		
		// Reset all states immediately
		setTimerActive(false);
		setTimerCompleted(false);
		setSelectedTimer(null);
		setInputValue("");
		setPotentialReward(null);
		setTimeRemaining(0);
		setPausedTimeRemaining(null);
		setAbandonmentCountdown(null);
		setIsShowingAbandonmentWarning(false);
		setAbandonmentStartTime(null);
		
		// Show session lost alert
		alert.showInfoAlert({
			title: "Session Lost",
			message: `You lost ${inputValue} tokens due to abandoning the session`,
			variant: "error",
			icon: "error"
		});
	}, [inputValue]);

	const startFocusTimer = useCallback(() => {
		if (focusTimerRef.current) {
			clearInterval(focusTimerRef.current);
		}
		
		focusTimerRef.current = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					setTimerActive(false);
					setTimerCompleted(true);
					if (focusTimerRef.current) {
						clearInterval(focusTimerRef.current);
						focusTimerRef.current = null;
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}, []);

	const handleResumeTimer = useCallback(() => {
		console.log('▶️ Resuming focus timer');
		
		if (pausedTimeRemaining !== null && pausedTimeRemaining > 0) {
			// Restore main timer
			setTimeRemaining(pausedTimeRemaining);
			setPausedTimeRemaining(null);
			
			// Restart focus timer
			startFocusTimer();
		}
		
		// Timer resumed successfully
	}, [pausedTimeRemaining, startFocusTimer]);

	// Timer effect actualizado
	useEffect(() => {
		if (timerActive && timeRemaining > 0 && appState === 'active' && !pausedTimeRemaining) {
			startFocusTimer();
		}
		
		return () => {
			if (focusTimerRef.current) {
				clearInterval(focusTimerRef.current);
				focusTimerRef.current = null;
			}
		};
	}, [timerActive, timeRemaining, appState, pausedTimeRemaining, startFocusTimer]);

	// Verify abandonment time when component remounts
	useEffect(() => {
		if (abandonmentStartTime && pausedTimeRemaining !== null) {
			const elapsedTime = Date.now() - abandonmentStartTime;
			const remainingTime = Math.max(0, 10000 - elapsedTime);
			
			if (remainingTime <= 0) {
				console.log('⚠️ Abandonment time exceeded during remount, executing session loss');
				handleAbandonSession();
			} else {
				// Restore abandonment timer
				if (abandonmentTimerRef.current) {
					clearInterval(abandonmentTimerRef.current);
				}
				
				abandonmentTimerRef.current = setInterval(() => {
					const currentElapsed = Date.now() - abandonmentStartTime;
					const currentRemaining = Math.max(0, 10000 - currentElapsed);
					const currentSeconds = Math.ceil(currentRemaining / 1000);
					
					console.log(`⏰ Abandonment timer (restored): ${currentSeconds}s remaining`);
					
					if (currentRemaining <= 0) {
						console.log('⏰ Abandonment timer: 0s - Executing session loss');
						handleAbandonSession();
					} else {
						setAbandonmentCountdown(currentSeconds);
					}
				}, 1000);
			}
		}
	}, [abandonmentStartTime, pausedTimeRemaining, handleAbandonSession]);

	// AppState listener
	useEffect(() => {
		const subscription = AppState.addEventListener('change', handleAppStateChange);
		
		return () => {
			subscription?.remove();
			// Limpiar timers al desmontar
			if (focusTimerRef.current) {
				clearInterval(focusTimerRef.current);
			}
			if (abandonmentTimerRef.current) {
				clearInterval(abandonmentTimerRef.current);
			}
		};
	}, [handleAppStateChange]);

	const calculateReward = (tokens: number, seconds: number) => {
		let factor = 0;
		if (tokens >= 1 && tokens < 3) {
			factor = 0.2;
		} else if (tokens >= 3 && tokens < 4) {
			factor = 0.1667;
		} else if (tokens >= 4 && tokens <= 5) {
			factor = 0.1;
		}

		// Convertir segundos a minutos según una escala lineal
		// Mínimo 5s = 1 minuto, máximo 15s = 3 minutos
		const minutes = ((seconds - 5) / 10) * 2 + 1; // Escala lineal de 1 a 3 minutos

		return tokens * minutes * factor;
	};

	const handleTokenAmountChange = (text: string) => {
		const regex = /^\d*\.?\d*$/;
		if (regex.test(text)) {
			setInputValue(text);
			const amount = Number(text);
			setHasEnoughTokens(!isNaN(amount) && amount >= 1 && amount <= 5 && amount <= Number(tokenBalance));
			
			// Calcular recompensa potencial si hay un timer seleccionado
			if (selectedTimer && !isNaN(amount) && amount >= 1 && amount <= 5) {
				const reward = calculateReward(amount, selectedTimer);
				setPotentialReward(reward);
			} else {
				setPotentialReward(null);
			}
		}
	};

	const handleTimerPress = (seconds: number) => {
		// Confirmar la selección del timer
		setSelectedTimer(seconds);
		setTimeRemaining(seconds);
		setTimerCompleted(false);
		// Mostrar el modal para ingresar tokens
		setShowStakeModal(true);
		// Recalcular recompensa si hay tokens ingresados
		if (inputValue) {
			const amount = Number(inputValue);
			if (!isNaN(amount) && amount >= 1 && amount <= 5) {
				const reward = calculateReward(amount, seconds);
				setPotentialReward(reward);
			}
		}
	};

	const startPlantingProcess = async () => {
		if (!account?.address || !inputValue || !selectedTimer) return;
		
		const amount = Number(inputValue);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Error", "Please enter a valid amount of tokens");
			return;
		}

		setTokensToInvest(amount);
		const confirmed = await alert.showConfirmAlert({
			title: "Confirm Tree Planting",
			message: `Invest ${amount} tokens for ${selectedTimer} seconds?`,
			confirmText: "Start Focus",
			cancelText: "Cancel",
			variant: "success",
			theme: "focus"
		});

		if (confirmed) {
			await handleConfirmTreePress();
		}
	};

	const handleConfirmTreePress = async () => {
		if (!account?.address || !inputValue || !selectedTimer) return;

		// Trigger tree animation when confirmed
		mysteryTreeRef.current?.triggerShine();

		setIsLoading(true);
		setIsProcessingTokens(true);
		try {
			// Primero reducimos el balance
			await reduceBalance(account.address, Number(inputValue));
			
			// Actualizar balance después de invertir tokens
			console.log('💰 Tokens invertidos, actualizando balance...');
			updateBalance();
			
			// If reduction was successful, start the timer
			console.log('▶️ Starting focus timer');
			setTimerActive(true);
		} catch (error) {
			console.error("Error processing tokens. Please try again.");
			Alert.alert("Error", "Error processing tokens. Please try again.");
		} finally {
			setIsLoading(false);
			setIsProcessingTokens(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const canStartPlanting = () => {
		const amount = Number(inputValue);
		return hasEnoughTokens && 
			selectedTimer !== null && 
			!timerActive && 
			!timerCompleted &&
			amount >= 1 &&
			amount <= 5;
	};

	const handleClaimTokens = async () => {
		if (!account?.address || !inputValue || !potentialReward) return;
		
		const totalAmount = Number(inputValue) + potentialReward;
		setRewardAmount(totalAmount);
		setRewardAlertType('tokens');
		
		const confirmed = await alert.showConfirmAlert({
			title: "Claim Tokens",
			message: `Claim ${totalAmount.toFixed(2)} tokens?`,
			confirmText: "Claim",
			cancelText: "Cancel",
			variant: "success",
			theme: "focus"
		});

		if (confirmed) {
			await handleConfirmClaimTokens();
		}
	};

	const handleConfirmClaimTokens = async () => {
		if (!account?.address || !inputValue || !potentialReward) return;
		
		setSelectedAction('tokens');
		setIsLoading(true);
		setIsProcessingTokens(true);
		try {
			const originalAmount = Number(inputValue);
			const totalAmount = originalAmount + potentialReward;
			await claimStaking(account.address, totalAmount);
			
			// Actualizar balance después de reclamar tokens
			console.log('🎉 Tokens reclamados, actualizando balance...');
			updateBalance();
			
			// Resetear completamente el estado
			setTimerCompleted(false);
			setTimerActive(false);
			setSelectedTimer(null);
			setInputValue("");
			setPotentialReward(null);
			setTimeRemaining(0);
		} catch (error) {
			console.error("Error claiming tokens. Please try again.");
			Alert.alert("Error", "Error claiming tokens. Please try again.");
		} finally {
			setIsLoading(false);
			setIsProcessingTokens(false);
			setSelectedAction(null);
		}
	};

	const handleMintNFT = async () => {
		if (!account?.address || !inputValue || !potentialReward) return;
		
		const totalAmount = Number(inputValue) + potentialReward;
		setRewardAmount(totalAmount);
		setRewardAlertType('mint');
		
		const confirmed = await alert.showConfirmAlert({
			title: "Mint NFT Tree",
			message: `Mint NFT tree with ${totalAmount.toFixed(2)} tokens?`,
			confirmText: "Mint NFT",
			cancelText: "Cancel",
			variant: "success",
			theme: "focus"
		});

		if (confirmed) {
			await handleConfirmMintNFT();
		}
	};

	const handleConfirmMintNFT = async () => {
		if (!account?.address || !inputValue || !potentialReward) return;
		
		setSelectedAction('nft');
		setIsLoading(true);
		setIsMintingNFT(true);
		try {
			const amount = Number(inputValue);
			await mintTree(account.address, amount + potentialReward);
			await alert.showInfoAlert({
				title: "NFT created successfully!",
				variant: "success",
				icon: "success",
				theme: "focus"
			});
			
			// Actualizar balance después de mintear NFT
			console.log('🌳 NFT minteado, actualizando balance...');
			updateBalance();
			
			// Trigger trees refresh
			triggerRefresh();
			
			// Resetear completamente el estado
			setTimerCompleted(false);
			setTimerActive(false);
			setSelectedTimer(null);
			setInputValue("");
			setPotentialReward(null);
			setTimeRemaining(0);
		} catch (error) {
			console.error("Error creating NFT. Please try again.");
			Alert.alert("Error", "Error creating NFT. Please try again.");
		} finally {
			setIsLoading(false);
			setIsMintingNFT(false);
			setSelectedAction(null);
		}
	};

	const handleTreePress = async () => {
		if (!account?.address) {
			Alert.alert("Error", "Please connect your wallet first");
			return;
		}

		if (Number(tokenBalance) < tokensToInvest) {
			Alert.alert("Error", `You need ${tokensToInvest} tokens to invest in this tree`);
			return;
		}

		if (!isTimerRunning) {
			Alert.alert("Error", "Please start the timer first");
			return;
		}

		const confirmed = await alert.showConfirmAlert({
			title: "Invest in Tree",
			message: `Invest ${tokensToInvest} tokens in this tree?`,
			confirmText: "Invest",
			cancelText: "Cancel",
			variant: "success",
			theme: "focus"
		});

		if (confirmed) {
			// Handle tree investment logic here
		}
	};

	if (!fontsLoaded) {
		return (
			<ThemedView style={styles.container}>
				<LoadingAnimation isLoading={true} />
			</ThemedView>
		);
	}

	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<StatusBar barStyle="dark-content" backgroundColor="#fef5eb" />
				{/* Header con balance en esquina superior derecha */}
				<ThemedView style={styles.header}>
					<ThemedText type="title" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 18, textAlign: 'center'}}>
						Focus
					</ThemedText>
					<ThemedView style={styles.balanceContainer}>
						<ThemedText style={styles.balanceText}>{tokenBalance}</ThemedText>
						<Image 
							source={require("@/assets/images/coin.png")}
							style={styles.coinIcon}
							resizeMode="contain"
						/>
					</ThemedView>
				</ThemedView>

				<ScrollView contentContainerStyle={[
					styles.scrollContainer,
					((isProcessingTokens && !timerCompleted) || timerActive) && styles.scrollContainerCentered
				]} showsVerticalScrollIndicator={false}>

							{/* Sección de procesamiento centralizada - SOLO cuando está procesando staking inicial */}
							{(isProcessingTokens && !timerCompleted) ? (
						<ThemedView style={styles.processingSection}>
							<ThemedText style={styles.processingSectionTitle}>
								Withdrawing coins
							</ThemedText>
							<ThemedView style={styles.processingContainer}>
								<CoinAnimation isLoading={true} />
							</ThemedView>
							<ThemedText style={styles.processingHelperText}>
								Processing tokens...
							</ThemedText>
						</ThemedView>
					) : timerActive ? (
						<>
							{/* Timer Active Display */}
							<ThemedView style={styles.timerDisplay}>
								{/* Clock Animation */}
								<View style={styles.clockContainer}>
									<ClockAnimation isActive={timerActive} size={120} />
								</View>
								
								<ThemedText style={styles.timerText}>
									Focus Time: {formatTime(timeRemaining)}
								</ThemedText>
								<ThemedText style={styles.timerSubtext}>
									Stay focused! Your tree is growing...
								</ThemedText>
							</ThemedView>


						</>
					) : (
						<>
							{/* Mystery Tree with Animation - Clickeable para iniciar focus, oculto durante procesamiento */}
							{!isMintingNFT && !isProcessingTokens && (
								<>
									<TouchableOpacity 
										onPress={() => {
											if (canStartPlanting() && !isLoading && hasParcel) {
												startPlantingProcess();
											}
										}}
										disabled={!canStartPlanting() || isLoading || !hasParcel}
										activeOpacity={canStartPlanting() && !isLoading && hasParcel ? 0.8 : 1}
									>
										<MysteryTree ref={mysteryTreeRef} disabled={!hasParcel} />
									</TouchableOpacity>
									{!hasParcel && (
										<ThemedText style={[styles.noParcelText, { fontFamily: 'PressStart2P_400Regular' }]}>
											You need a parcel to be able to focus
										</ThemedText>
									)}
								</>
							)}

							{/* Timer Selection - Solo cuando NO está completado y tiene parcela */}
							{!timerCompleted && hasParcel && (
								<ThemedView style={styles.timerSection}>
									<ThemedText style={styles.sectionTitle}>Focus Duration</ThemedText>
									<ThemedView style={styles.timerSliderContainer}>
										<TimeSlider
											value={sliderValue}
											onValueChange={(value) => {
												setSliderValue(value);
												// Recalcular recompensa potencial si hay tokens ingresados
												if (inputValue) {
													const amount = Number(inputValue);
													if (!isNaN(amount) && amount >= 1 && amount <= 5) {
														const reward = calculateReward(amount, value);
														setPotentialReward(reward);
													}
												}
											}}
										/>
										
										{/* Expected Earnings integrado dentro del mismo rectángulo */}
										{selectedTimer && inputValue && potentialReward !== null && parseFloat(inputValue) > 0 && (
											<ThemedView style={styles.integratedEarningsContainer}>
												<ThemedText style={styles.integratedEarningsText}>
													💰 Expected: +{potentialReward.toFixed(3)} FT
												</ThemedText>
												<ThemedText style={styles.integratedHelperText}>
													{canStartPlanting() && !isLoading ? 
														"🌳 Click the tree to start!" : 
														"Ready to focus!"}
												</ThemedText>
											</ThemedView>
										)}
										
										{!selectedTimer && (
											<TouchableOpacity
												style={styles.confirmTimeButton}
												onPress={() => handleTimerPress(sliderValue)}
												disabled={timerActive || timerCompleted}
											>
												<ThemedText style={styles.confirmTimeButtonText}>
													OK
												</ThemedText>
											</TouchableOpacity>
										)}
										{selectedTimer && (
											<TouchableOpacity
												style={styles.changeTimeButton}
												onPress={() => {
													setSelectedTimer(null);
													setInputValue("");
													setPotentialReward(null);
													setShowEarnings(false);
												}}
												disabled={timerActive || timerCompleted}
											>
												<ThemedText style={styles.changeTimeButtonText}>
													Change Time
												</ThemedText>
											</TouchableOpacity>
										)}
									</ThemedView>
								</ThemedView>
							)}

										{/* Timer Completed - Claim Options */}
										{timerCompleted && (
											<ThemedView style={styles.claimSection}>
												{(isProcessingTokens || isMintingNFT) ? (
													<>
														{/* Estado de carga dentro de la cajita */}
														<ThemedText style={styles.completedText}>
															{selectedAction === 'tokens' ? 'Receiving coins' : 'Creating NFT'}
														</ThemedText>
														<ThemedView style={styles.processingContainer}>
															{selectedAction === 'nft' ? (
																<LoadingAnimation isLoading={true} />
															) : (
																<CoinAnimation isLoading={true} />
															)}
														</ThemedView>
														<ThemedText style={styles.processingHelperText}>
															{selectedAction === 'tokens' ? 'Processing reward...' : 'Creating NFT...'}
														</ThemedText>
													</>
												) : (
													<>
														{/* Estado normal de la cajita */}
														<ThemedText style={styles.completedText}>🎉 Focus completed!</ThemedText>
														<ThemedText style={styles.claimText}>
															You earned {potentialReward?.toFixed(3)} FT extra!
														</ThemedText>
														
														<ThemedView style={styles.claimButtons}>
															<TouchableOpacity
																style={styles.claimButton}
																onPress={handleClaimTokens}
																disabled={isLoading}
															>
																<ThemedText style={styles.claimButtonText}>Claim Tokens</ThemedText>
															</TouchableOpacity>
															
															<TouchableOpacity
																style={[styles.claimButton, styles.nftButton]}
																onPress={handleMintNFT}
																disabled={isLoading}
															>
																<ThemedText style={styles.claimButtonText}>Mint NFT</ThemedText>
															</TouchableOpacity>
														</ThemedView>
													</>
												)}
											</ThemedView>
										)}
						</>
					)}

							
				</ScrollView>

				{/* Modal para Amount to Stake */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={showStakeModal}
					onRequestClose={() => setShowStakeModal(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<View style={styles.modalHeader}>
								<ThemedText style={styles.modalTitle}>Amount to Stake</ThemedText>
								<TouchableOpacity 
									style={styles.closeButton}
									onPress={() => setShowStakeModal(false)}
								>
									<ThemedText style={styles.closeButtonText}>✕</ThemedText>
								</TouchableOpacity>
							</View>
							
							<ThemedView style={styles.modalInputContainer}>
								<TextInput
									style={styles.modalInput}
									value={inputValue}
									onChangeText={handleTokenAmountChange}
									placeholder="1-5 tokens"
									placeholderTextColor="#666"
									keyboardType="numeric"
									autoFocus={true}
								/>
								<ThemedText style={styles.modalInputSuffix}>FT</ThemedText>
							</ThemedView>
							
							<TouchableOpacity
								style={[styles.modalButton, (!canStartPlanting() || isLoading) && styles.modalButtonDisabled]}
								onPress={() => {
									if (canStartPlanting() && !isLoading) {
										setShowStakeModal(false);
										setShowEarnings(true);
									}
								}}
								disabled={!canStartPlanting() || isLoading}
							>
								<ThemedText style={styles.modalButtonText}>Confirm Stake</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>

				<AlertRenderer alerts={alert._alerts} />

			</ThemedView>
		</ProtectedRoute>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fef5eb',
	},
	scrollContainer: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 20,
	},
	scrollContainerCentered: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	header: {
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 20,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		marginTop: 40,
		marginBottom: 20,
	},
	title: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 18,
		color: '#2d5016',
		textAlign: 'center',
		flex: 1,
	},
	balanceContainer: {
		position: 'absolute',
		right: 20,
		top: 60,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.8)',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#2d5016',
	},
	balanceText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#2d5016',
		marginRight: 6,
	},
	coinIcon: {
		width: 16,
		height: 16,
	},
	inputSection: {
		backgroundColor: 'rgba(255, 255, 255, 0.7)',
		borderRadius: 15,
		padding: 20,
		marginBottom: 20,
		marginHorizontal: 10,
		borderWidth: 2,
		borderColor: '#2d5016',
		maxWidth: 400,
		alignSelf: 'center',
	},
	sectionTitle: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: '#2d5016',
		marginBottom: 10,
		textAlign: 'center',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'white',
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#2d5016',
		paddingHorizontal: 15,
		marginBottom: 10,
	},
	input: {
		flex: 1,
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		paddingVertical: 15,
	},
	inputSuffix: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: '#4a7c59',
	},
	helperText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#666',
		textAlign: 'center',
	},
	timerSection: {
		backgroundColor: '#fef5eb',
		borderRadius: 15,
		padding: 15,
		marginBottom: 10,
		marginHorizontal: 10,
		borderWidth: 2,
		borderColor: '#2d5016',
		maxWidth: 400,
		alignSelf: 'center',
	},
	timerSliderContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 10,
	},
	timerDisplay: {
		backgroundColor: '#fef5eb',
		borderRadius: 15,
		padding: 15,
		alignItems: 'center',
		marginVertical: 15,
		marginHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		maxWidth: 350,
		alignSelf: 'center',
	},
	clockContainer: {
		marginBottom: 10,
	},
	timerText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 18,
		color: '#2d5016',
		marginBottom: 10,
	},
	timerSubtext: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#4a7c59',
		textAlign: 'center',
	},
	claimSection: {
		backgroundColor: '#fef5eb',
		borderRadius: 15,
		padding: 25,
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 15,
		marginHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		maxWidth: 350,
		alignSelf: 'center',
	},
	completedText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		marginBottom: 10,
		textAlign: 'center',
	},
	claimText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#4a7c59',
		marginBottom: 20,
		textAlign: 'center',
	},
	claimButtons: {
		flexDirection: 'row',
		gap: 15,
	},
	claimButton: {
		backgroundColor: '#4a7c59',
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		minWidth: 120,
		alignItems: 'center',
	},
	nftButton: {
		backgroundColor: '#6b5b95',
	},
	claimButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: 'white',
		textAlign: 'center',
	},
	processingSection: {
		backgroundColor: '#fef5eb',
		borderRadius: 15,
		padding: 25,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		maxWidth: 350,
		alignSelf: 'center',
	},
	processingSectionTitle: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		marginBottom: 15,
		textAlign: 'center',
	},
	processingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 15,
	},
	processingHelperText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#4a7c59',
		textAlign: 'center',
		marginTop: 10,
	},
	rewardContainer: {
		backgroundColor: '#fef5eb',
		borderRadius: 10,
		padding: 10,
		marginBottom: 10,
	},
	rewardTextContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	rewardText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#2d5016',
	},
	// Estilos para la sección de ganancias
	earningsSection: {
		backgroundColor: '#fef5eb',
		borderRadius: 15,
		padding: 20,
		marginBottom: 20,
		marginHorizontal: 10,
		borderWidth: 2,
		borderColor: '#4a7c59',
		maxWidth: 400,
		alignSelf: 'center',
	},
	earningSectionTitle: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: '#2d5016',
		marginBottom: 15,
		textAlign: 'center',
	},
	earningsContainer: {
		backgroundColor: '#fef5eb',
		borderRadius: 10,
		padding: 15,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#4a7c59',
	},
	earningsText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 11,
		color: '#2d5016',
		textAlign: 'center',
	},
	// Estilos para el modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fef5eb',
		borderRadius: 20,
		padding: 25,
		margin: 20,
		minWidth: 300,
		maxWidth: 350,
		borderWidth: 3,
		borderColor: '#2d5016',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		flex: 1,
		textAlign: 'center',
	},
	closeButton: {
		position: 'absolute',
		right: 0,
		top: -5,
		padding: 5,
	},
	closeButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 16,
		color: '#2d5016',
	},
	modalInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'white',
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#2d5016',
		paddingHorizontal: 15,
		marginBottom: 20,
	},
	modalInput: {
		flex: 1,
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 14,
		color: '#2d5016',
		paddingVertical: 15,
	},
	modalInputSuffix: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: '#4a7c59',
	},
	modalButton: {
		backgroundColor: '#2d5016',
		borderRadius: 10,
		paddingVertical: 15,
		paddingHorizontal: 20,
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#1a3009',
	},
	modalButtonDisabled: {
		backgroundColor: '#ccc',
		borderColor: '#999',
	},
	modalButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 12,
		color: 'white',
	},
	noParcelState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	noParcelImage: {
		width: 120,
		height: 120,
		marginBottom: 20,
	},
	noParcelText: {
		textAlign: 'center',
		fontSize: 14,
	},
	confirmTimeButton: {
		backgroundColor: '#4a7c59',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		minWidth: 120,
		alignItems: 'center',
	},
	confirmTimeButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: 'white',
		textAlign: 'center',
	},
	changeTimeButton: {
		backgroundColor: '#6b5b95',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderWidth: 2,
		borderColor: '#2d5016',
		minWidth: 120,
		alignItems: 'center',
	},
	changeTimeButtonText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: 'white',
		textAlign: 'center',
	},
	integratedEarningsContainer: {
		backgroundColor: 'rgba(74, 124, 89, 0.1)',
		borderRadius: 8,
		padding: 8,
		marginVertical: 5,
		borderWidth: 1,
		borderColor: '#4a7c59',
		alignItems: 'center',
	},
	integratedEarningsText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 10,
		color: '#2d5016',
		textAlign: 'center',
		marginBottom: 4,
	},
	integratedHelperText: {
		fontFamily: 'PressStart2P_400Regular',
		fontSize: 8,
		color: '#4a7c59',
		textAlign: 'center',
	},


}); 