import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

interface ResumeTimerAlertProps {
  show: boolean;
  onClose: () => void;
  onResume: () => void;
  timeRemaining: number;
}

export const ResumeTimerAlert: React.FC<ResumeTimerAlertProps> = ({ 
  show, 
  onClose, 
  onResume, 
  timeRemaining 
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

  const handleResume = () => {
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onResume();
      onClose();
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          source={require("@/assets/images/clock_1.png")}
          style={styles.clockIcon}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          You have {formatTime(timeRemaining)} remaining in your focus session
        </Text>
        <Text style={styles.helperText}>
          Tap Resume to continue where you left off
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.resumeButton]}
            onPress={handleResume}
          >
            <Text style={styles.buttonText}>Resume</Text>
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
  clockIcon: {
    width: 50,
    height: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontFamily: 'PressStart2P_400Regular',
    color: '#2d5016',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  helperText: {
    fontSize: 8,
    fontFamily: 'PressStart2P_400Regular',
    color: '#666',
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
    borderColor: '#2d5016',
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#4a7c59',
  },
  buttonText: {
    color: '#fef5eb',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
  },
}); 