import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { BaseAlert } from './BaseAlert';
import { ConfirmAlertProps } from '@/types/alerts';
import { 
  focusAlertTheme, 
  friendsAlertTheme, 
  sessionLostTheme, 
  defaultAlertTheme 
} from '@/constants/AlertTheme';

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

  // Get theme config for styling
  const getThemeConfig = () => {
    switch (theme) {
      case 'focus':
        return focusAlertTheme;
      case 'friends':
        return friendsAlertTheme;
      case 'sessionLost':
        return sessionLostTheme;
      default:
        return defaultAlertTheme;
    }
  };

  const themeConfig = getThemeConfig();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!fontsLoaded) return null;

  // Use theme-specific styles or fallback to default
  const titleStyle = themeConfig.typography?.title || styles.title;
  const subtitleStyle = themeConfig.typography?.subtitle || styles.subtitle;
  const buttonContainerStyle = [
    styles.buttonContainer, 
    { gap: themeConfig.buttons?.gap || 15 }
  ];
  const buttonStyle = themeConfig.buttons?.button || styles.button;
  const confirmButtonStyle = [
    buttonStyle,
    themeConfig.buttons?.confirm || styles.confirmButton,
    variant === 'destructive' && (themeConfig.buttons?.destructive || styles.destructiveButton)
  ];
  const cancelButtonStyle = [
    buttonStyle,
    themeConfig.buttons?.cancel || styles.cancelButton
  ];
  const buttonTextStyle = themeConfig.buttons?.text || styles.buttonText;

  return (
    <BaseAlert
      show={show}
      onClose={onClose}
      icon={icon}
      position={position}
      theme={theme}
      allowBackdropClose={allowBackdropClose}
    >
      <Text style={titleStyle}>
        {title}
      </Text>
      {message && (
        <Text style={subtitleStyle}>
          {message}
        </Text>
      )}
      <View style={buttonContainerStyle}>
        <TouchableOpacity
          style={cancelButtonStyle}
          onPress={onClose}
        >
          <Text style={buttonTextStyle}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={confirmButtonStyle}
          onPress={handleConfirm}
        >
          <Text style={[
            buttonTextStyle,
            (variant === 'destructive' && theme === 'sessionLost') && { color: '#fef5eb' }
          ]}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseAlert>
  );
};

// Fallback styles for when theme doesn't provide specific styles
const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: 'PressStart2P_400Regular',
    color: '#2d5016',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a7c59',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2d5016',
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4a7c59',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  destructiveButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#2d5016',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
  },
}); 