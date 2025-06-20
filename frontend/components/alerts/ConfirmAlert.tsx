import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { BaseAlert, BaseAlertRef } from './BaseAlert';
import { ConfirmAlertProps } from '@/types/alerts';

export const ConfirmAlert: React.FC<ConfirmAlertProps> = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
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

  const handleCancel = () => {
    // Use animated close instead of direct onClose
    baseAlertRef.current?.closeWithAnimation();
  };

  const handleConfirm = () => {
    onConfirm();
    // Use animated close instead of direct onClose
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
        <Text style={styles.subtitle}>
          {message}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.buttonText}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            variant === 'destructive' ? styles.destructiveButton : styles.confirmButton
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.buttonText}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
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
  confirmButton: {
    backgroundColor: '#4a7c59',
  },
  cancelButton: {
    backgroundColor: '#fef5eb',
  },
  destructiveButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#2d5016',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
  },
}); 