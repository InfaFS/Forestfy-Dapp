import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface SessionLostAlertProps {
  show: boolean;
  onClose: () => void;
  tokensLost: string;
}

export const SessionLostAlert: React.FC<SessionLostAlertProps> = ({ 
  show, 
  onClose, 
  tokensLost 
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
    }).start(() => {
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
          source={require("@/assets/images/marchitado.png")}
          style={styles.lostIcon}
          resizeMode="contain"
        />
        <Text style={styles.title}>Session Lost</Text>
        <Text style={styles.subtitle}>
          You were away for more than 10 seconds
        </Text>
        <Text style={styles.tokensText}>
          Lost: {tokensLost} tokens
        </Text>
        <Text style={styles.helperText}>
          Try again to start a new focus session
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.okButton]}
            onPress={handleClose}
          >
            <Text style={styles.buttonText}>OK</Text>
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
    backgroundColor: '#ffebee',
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#d32f2f',
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
  lostIcon: {
    width: 50,
    height: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontFamily: 'PressStart2P_400Regular',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'PressStart2P_400Regular',
    color: '#b71c1c',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  tokensText: {
    fontSize: 12,
    fontFamily: 'PressStart2P_400Regular',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  helperText: {
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fef5eb',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
  },
}); 