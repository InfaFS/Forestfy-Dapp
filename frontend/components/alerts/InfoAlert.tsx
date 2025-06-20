import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { BaseAlert } from './BaseAlert';
import { InfoAlertProps } from '@/types/alerts';
import { 
  focusAlertTheme, 
  friendsAlertTheme, 
  sessionLostTheme, 
  defaultAlertTheme 
} from '@/constants/AlertTheme';

export const InfoAlert: React.FC<InfoAlertProps> = ({
  show,
  onClose,
  title,
  message,
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

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      onClose();
    }
  };

  if (!fontsLoaded) return null;

  // Use theme-specific styles or fallback to default
  const titleStyle = themeConfig.typography?.title || styles.title;
  const subtitleStyle = themeConfig.typography?.subtitle || styles.subtitle;
  const buttonStyle = [
    themeConfig.buttons?.button || styles.button,
    themeConfig.buttons?.confirm || styles.confirmButton,
    variant === 'destructive' && (themeConfig.buttons?.destructive || styles.destructiveButton)
  ];
  const buttonTextStyle = [
    themeConfig.buttons?.text || styles.buttonText,
    (variant === 'destructive' && theme === 'sessionLost') && { color: '#fef5eb' }
  ];

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
      <TouchableOpacity
        style={buttonStyle}
        onPress={handleButtonPress}
      >
        <Text style={buttonTextStyle}>
          {buttonText}
        </Text>
      </TouchableOpacity>
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
  button: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2d5016',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    fontSize: 10,
  },
}); 