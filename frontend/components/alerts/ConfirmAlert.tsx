import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BaseAlert } from './BaseAlert';
import { ConfirmAlertProps } from '@/types/alerts';
import { defaultAlertTheme, getVariantColors } from '@/constants/AlertTheme';

export const ConfirmAlert: React.FC<ConfirmAlertProps> = ({
  show,
  onClose,
  onConfirm,
  onCancel,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor,
  isLoading = false,
  destructive = false,
  variant = 'neutral',
  icon = 'logo',
  position = 'center',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const colors = getVariantColors(variant);
  const finalConfirmColor = confirmColor || (destructive ? '#d32f2f' : colors.primary);

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      if (onCancel) {
        onCancel();
      } else {
        onClose();
      }
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
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { opacity: isLoading ? 0.5 : 1 }
          ]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {cancelText}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            { 
              backgroundColor: finalConfirmColor,
              opacity: isLoading ? 0.7 : 1 
            }
          ]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {isLoading ? "..." : confirmText}
          </Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: defaultAlertTheme.spacing.buttonGap,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    maxWidth: 110,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: defaultAlertTheme.colors.secondary,
  },
  confirmButton: {
    backgroundColor: defaultAlertTheme.colors.primary,
  },
  buttonText: {
    fontFamily: defaultAlertTheme.fonts.primary,
    fontSize: defaultAlertTheme.fonts.sizes.button,
  },
}); 