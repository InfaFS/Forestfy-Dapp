import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface ConfirmationAlertProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  isLoading?: boolean;
}

export const ConfirmationAlert: React.FC<ConfirmationAlertProps> = ({ 
  show, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#4a7c59",
  isLoading = false
}) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;

  // Cargar fuentes pixel
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  useEffect(() => {
    if (show) {
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [show]);

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while loading
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleConfirm = () => {
    if (isLoading) return; // Prevent multiple clicks
    onConfirm();
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
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.confirmButton,
              { backgroundColor: confirmColor },
              { opacity: isLoading ? 0.7 : 1 }
            ]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "..." : confirmText}
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
    paddingHorizontal: 40,
  },
  alertContent: {
    backgroundColor: '#fef5eb',
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#2d5016',
    paddingVertical: 25,
    paddingHorizontal: 35,
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
  message: {
    fontSize: 10,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d5016',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    maxWidth: 110,
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