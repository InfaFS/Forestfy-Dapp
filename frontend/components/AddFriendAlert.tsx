import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, TextInput } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { UserRegistryContract } from '@/constants/thirdweb';
import { sendFriendRequest } from '@/constants/api';

interface AddFriendAlertProps {
  show: boolean;
  onClose: () => void;
  onSendFriendRequest: (username: string, toAddress: string) => void;
  onSuccess?: (message: string) => void;
}

export const AddFriendAlert: React.FC<AddFriendAlertProps> = ({ show, onClose, onSendFriendRequest, onSuccess }) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [userError, setUserError] = useState('');
  const account = useActiveAccount();

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Get address by username
  const { data: userAddress, refetch: getUserAddress } = useReadContract({
    contract: UserRegistryContract,
    method: "function getAddressByName(string) view returns (address)",
    params: [username.trim()],
    queryOptions: {
      enabled: false, // Only check when manually triggered
    },
  });

  // Check if already friends
  const { data: areFriends, refetch: checkFriendship } = useReadContract({
    contract: UserRegistryContract,
    method: "function areFriends(address, address) view returns (bool)",
    params: [account?.address || "", userAddress || ""],
    queryOptions: {
      enabled: false, // Only check when manually triggered
    },
  });

  // Check if friend request already sent
  const { data: requestSent, refetch: checkFriendRequest } = useReadContract({
    contract: UserRegistryContract,
    method: "function friendRequests(address, address) view returns (bool)",
    params: [account?.address || "", userAddress || ""],
    queryOptions: {
      enabled: false, // Only check when manually triggered
    },
  });

  useEffect(() => {
    if (show) {
      setUsername(''); // Limpiar el input cuando se abre
      setUserError('');
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [show]);

  const handleClose = () => {
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setUsername('');
      setUserError('');
      onClose();
    });
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setUserError('');
  };

  const handleSendRequest = async () => {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setUserError('Please enter a username');
      return;
    }

    if (!account?.address) {
      setUserError('Please connect your wallet');
      return;
    }

    setIsChecking(true);
    setUserError('');

    try {
      // First, get the user's address by username
      await getUserAddress();
      
      // Wait a bit for the query to complete
      setTimeout(async () => {
        if (!userAddress || userAddress === "0x0000000000000000000000000000000000000000") {
          setUserError('User not found');
          setIsChecking(false);
          return;
        }

        if (userAddress === account?.address) {
          setUserError('Cannot add yourself as friend');
          setIsChecking(false);
          return;
        }

        // Check if already friends
        await checkFriendship();
        if (areFriends) {
          setUserError('Already friends with this user');
          setIsChecking(false);
          return;
        }

        // Check if request already sent
        await checkFriendRequest();
        if (requestSent) {
          setUserError('Friend request already sent');
          setIsChecking(false);
          return;
        }

        // All checks passed, send friend request and show success
        try {
          await sendFriendRequest(account.address, userAddress);
          
          // Show success message
          if (onSuccess) {
            onSuccess(`Friend request sent to ${trimmedUsername} successfully!`);
          }
          
          // Close the alert with animation
          Animated.timing(alertOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setUsername('');
            setUserError('');
            setIsChecking(false);
            onClose();
          });
          
        } catch (error: any) {
          console.error('Error sending friend request:', error);
          setUserError(error.message || 'Error sending friend request');
          setIsChecking(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error checking user:', error);
      setUserError('Error checking user');
      setIsChecking(false);
    }
  };

  if (!show || !fontsLoaded) return null;

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          opacity: alertOpacity,
        },
      ]}
    >
      <View style={styles.alertContent}>
        <Image 
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Add Friend</Text>
        <Text style={styles.subtitle}>Enter the username to add as friend</Text>
        
        <TextInput
          style={[styles.input, userError ? styles.inputError : null]}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          placeholderTextColor="#999"
          autoFocus={show}
          maxLength={50}
          autoCapitalize="none"
        />
        
        {userError ? (
          <Text style={styles.errorText}>{userError}</Text>
        ) : null}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={isChecking}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.confirmButton,
              { opacity: (username.trim() && !isChecking) ? 1 : 0.5 }
            ]}
            onPress={handleSendRequest}
            disabled={!username.trim() || isChecking}
          >
            <Text style={styles.buttonText}>
              {isChecking ? 'Checking...' : 'Send Request'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  alertContent: {
    backgroundColor: '#fef5eb',
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#2d5016',
    paddingVertical: 25,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: '90%',
    minWidth: 300,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 15,
  },
  title: {
    fontSize: 12,
    fontFamily: 'PressStart2P_400Regular',
    color: '#2d5016',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#2d5016',
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d5016',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fef5eb',
  },
  confirmButton: {
    backgroundColor: '#4a7c59',
  },
  buttonText: {
    color: '#2d5016',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
  },
  inputError: {
    borderColor: '#ff6b35',
  },
  errorText: {
    fontSize: 7,
    fontFamily: 'PressStart2P_400Regular',
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 10,
  },
}); 