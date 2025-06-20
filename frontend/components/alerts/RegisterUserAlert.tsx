import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, TextInput } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { UserRegistryContract } from '@/constants/thirdweb';
import { registerUser } from '@/constants/api';

interface RegisterUserAlertProps {
  show: boolean;
  onClose: () => void;
  onRegister: (username: string) => void;
}

export const RegisterUserAlert: React.FC<RegisterUserAlertProps> = ({ show, onClose, onRegister }) => {
  const account = useActiveAccount();
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  useEffect(() => {
    if (show) {
      setUsername(''); // Limpiar el input cuando se abre
      setErrorMessage(''); // Limpiar errores
      setIsLoading(false); // Reset loading state
      setShowSuccess(false); // Reset success state
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
      setErrorMessage('');
      setIsLoading(false);
      setShowSuccess(false);
      onClose();
    });
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setErrorMessage('Please enter a username');
      return;
    }

    if (!account?.address) {
      setErrorMessage('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      // Verificar si el nombre está disponible
      const isAvailable = await readContract({
        contract: UserRegistryContract,
        method: "function isNameAvailable(string memory _name) view returns (bool)",
        params: [username.trim()]
      });

      if (!isAvailable) {
        setErrorMessage('This name is already taken. Please choose another name.');
        setIsLoading(false);
        return;
      }

      // Si el nombre está disponible, proceder con el registro
      await registerUser(account.address, username.trim());
      
      // Registro exitoso - mostrar mensaje de éxito
      setIsLoading(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error durante el registro:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error registering user');
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onRegister(username.trim());
      setUsername('');
      setErrorMessage('');
      setIsLoading(false);
      setShowSuccess(false);
      onClose();
    });
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
        
        {showSuccess ? (
          <>
            <Text style={styles.title}>Successfully Registered!</Text>
            <Text style={styles.subtitle}>Your user has been successfully registered in Forestfy</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleSuccess}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Register User</Text>
            <Text style={styles.subtitle}>Enter your username to register in Forestfy</Text>
            
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#999"
              autoFocus={show}
              maxLength={50}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.cancelButton,
                  { opacity: isLoading ? 0.5 : 1 }
                ]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton,
                  { opacity: (username.trim() && !isLoading) ? 1 : 0.5 }
                ]}
                onPress={handleRegister}
                disabled={!username.trim() || isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Registering...' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    paddingHorizontal: 40,
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
    maxWidth: '85%',
    minWidth: 280,
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
  errorText: {
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
    color: '#d42c2c',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 12,
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
}); 