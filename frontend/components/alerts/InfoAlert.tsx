import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BaseAlert } from './BaseAlert';
import { InfoAlertProps } from '@/types/alerts';
import { defaultAlertTheme, getVariantColors } from '@/constants/AlertTheme';

export const InfoAlert: React.FC<InfoAlertProps> = ({
  show,
  onClose,
  onButtonPress,
  title = "Information",
  message,
  buttonText = "Accept",
  variant = 'info',
  icon = 'logo',
  position = 'center',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const colors = getVariantColors(variant);

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      onClose();
    }
  };

  return (
    <BaseAlert
      show={show}
      onClose={onClose}
      icon={icon}
      position={position}
      autoClose={autoClose}
      autoCloseDelay={autoCloseDelay}
      allowBackdropClose={true}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary }
        ]}
        onPress={handleButtonPress}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </BaseAlert>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: defaultAlertTheme.fonts.sizes.title,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  message: {
    fontSize: defaultAlertTheme.fonts.sizes.message,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 14,
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: defaultAlertTheme.fonts.primary,
    fontSize: defaultAlertTheme.fonts.sizes.button,
  },
}); 