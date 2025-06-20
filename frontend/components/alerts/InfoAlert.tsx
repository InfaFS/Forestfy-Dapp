import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { BaseAlert, BaseAlertRef } from './BaseAlert';
import { InfoAlertProps } from '@/types/alerts';

export const InfoAlert: React.FC<InfoAlertProps> = ({
  show,
  onClose,
  title,
  message,
  subtitle,
  buttonText = "OK",
  onButtonPress,
  variant = "neutral",
  icon = "logo",
  position,
  theme = 'default',
  allowBackdropClose = false,
}) => {
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  const baseAlertRef = useRef<BaseAlertRef>(null);

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    }
    // Always use animated close
    baseAlertRef.current?.closeWithAnimation();
  };

  if (!fontsLoaded) return null;

  return (
    <BaseAlert
      ref={baseAlertRef}
      show={show}
      onClose={onClose}
      icon={icon}
      position={position}
      theme={theme}
      allowBackdropClose={allowBackdropClose}
    >
      <Text style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text style={styles.message}>
          {message}
        </Text>
      )}
      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.button,
          variant === 'destructive' ? styles.destructiveButton : styles.confirmButton
        ]}
        onPress={handleButtonPress}
      >
        <Text style={styles.buttonText}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </BaseAlert>
  );
};

// NFT alert styling (same as ConfirmNFTListAlert)
const styles = StyleSheet.create({
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
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 14,
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d5016',
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#4a7c59',
  },
  destructiveButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#2d5016',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
  },
  message: {
    fontSize: 10,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
}); 