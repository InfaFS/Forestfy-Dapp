import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface ConfirmNFTUnlistAlertProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nftName: string;
}

export const ConfirmNFTUnlistAlert: React.FC<ConfirmNFTUnlistAlertProps> = ({ 
  show, 
  onClose, 
  onConfirm, 
  nftName 
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
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleConfirm = () => {
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onConfirm();
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
        <Text style={styles.title}>Confirm Unlisting</Text>
        <Text style={styles.subtitle}>
          Are you sure you want to unlist {nftName} from the marketplace?
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Unlist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: '40%',
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
    paddingHorizontal: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
    maxWidth: '90%',
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
    fontSize: 10,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 14,
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
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fef5eb',
  },
  confirmButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#2d5016',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
  },
}); 