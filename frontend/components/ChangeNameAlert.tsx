import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { UserRegistryContract } from '@/constants/thirdweb';

interface ChangeNameAlertProps {
  show: boolean;
  onClose: () => void;
  onChangeName: (newName: string) => void;
  currentName?: string;
}

export const ChangeNameAlert: React.FC<ChangeNameAlertProps> = ({ 
  show, 
  onClose, 
  onChangeName, 
  currentName = '' 
}) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const [newName, setNewName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [nameError, setNameError] = useState('');
  const account = useActiveAccount();

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  // Check if name is available
  const { data: isNameAvailable, refetch: checkNameAvailability } = useReadContract({
    contract: UserRegistryContract,
    method: "function isNameAvailable(string) view returns (bool)",
    params: [newName.trim()],
    queryOptions: {
      enabled: false, // Only check when manually triggered
    },
  });

  useEffect(() => {
    if (show) {
      setNewName(''); // Clear input when opened
      setNameError('');
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
      setNewName('');
      setNameError('');
      onClose();
    });
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      return 'Name cannot be empty';
    }
    if (name.length > 50) {
      return 'Name too long (max 50 characters)';
    }
    if (name.trim() === currentName) {
      return 'Please enter a different name';
    }
    return '';
  };

  const handleNameChange = (text: string) => {
    setNewName(text);
    setNameError('');
  };

  const handleChangeName = async () => {
    const trimmedName = newName.trim();
    
    // Validate name
    const validationError = validateName(trimmedName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setIsChecking(true);
    setNameError('');

    try {
      // Check name availability
      await checkNameAvailability();
      
      // Wait a bit for the query to complete
      setTimeout(() => {
        if (isNameAvailable === false) {
          setNameError('Name already taken');
          setIsChecking(false);
          return;
        }

        // Name is available, proceed with change
        Animated.timing(alertOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onChangeName(trimmedName);
          setNewName('');
          setNameError('');
          setIsChecking(false);
          onClose();
        });
      }, 500);
      
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameError('Error checking name availability');
      setIsChecking(false);
    }
  };

  if (!show || !fontsLoaded) return null;

  const canChangeName = newName.trim() && !nameError && !isChecking;

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
        <Text style={styles.title}>Change Name</Text>
        <Text style={styles.subtitle}>
          Current: {currentName}
        </Text>
        <Text style={styles.costNote}>
          Cost: 10 Forest Tokens
        </Text>
        
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          value={newName}
          onChangeText={handleNameChange}
          placeholder="Enter new name"
          placeholderTextColor="#999"
          autoFocus={show}
          maxLength={50}
          autoCapitalize="none"
        />
        
        {nameError ? (
          <Text style={styles.errorText}>{nameError}</Text>
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
              { opacity: canChangeName ? 1 : 0.5 }
            ]}
            onPress={handleChangeName}
            disabled={!canChangeName}
          >
            <Text style={styles.buttonText}>
              {isChecking ? 'Checking...' : 'Change Name'}
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
    top: '25%',
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
    minWidth: 320,
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
    marginBottom: 5,
    textAlign: 'center',
    lineHeight: 12,
  },
  costNote: {
    fontSize: 7,
    fontFamily: 'PressStart2P_400Regular',
    color: '#ff6b35',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 10,
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
    marginBottom: 5,
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
    minWidth: 100,
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
}); 