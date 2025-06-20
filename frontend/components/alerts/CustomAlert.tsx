import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BaseAlert } from './BaseAlert';
import { CustomAlertProps, AlertAction } from '@/types/alerts';
import { defaultAlertTheme } from '@/constants/AlertTheme';

export const CustomAlert: React.FC<CustomAlertProps> = ({
  show,
  onClose,
  children,
  actions = [],
  title,
  message,
  contentStyle,
  variant = 'neutral',
  icon = 'logo',
  position = 'center',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {

  const renderAction = (action: AlertAction, index: number) => {
    const getButtonStyle = () => {
      switch (action.style) {
        case 'primary':
          return [styles.button, styles.primaryButton];
        case 'destructive':
          return [styles.button, styles.destructiveButton];
        case 'secondary':
        default:
          return [styles.button, styles.secondaryButton];
      }
    };

    const getTextColor = () => {
      switch (action.style) {
        case 'primary':
        case 'destructive':
          return '#fff';
        case 'secondary':
        default:
          return defaultAlertTheme.colors.text;
      }
    };

    return (
      <TouchableOpacity
        key={index}
        style={[
          ...getButtonStyle(),
          { 
            opacity: (action.disabled || action.loading) ? 0.5 : 1,
            flex: actions.length > 1 ? 1 : 0,
            minWidth: actions.length === 1 ? 120 : undefined,
          }
        ]}
        onPress={action.onPress}
        disabled={action.disabled || action.loading}
      >
        <Text style={[styles.buttonText, { color: getTextColor() }]}>
          {action.loading ? "..." : action.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <BaseAlert
      show={show}
      onClose={onClose}
      icon={icon}
      position={position}
      autoClose={autoClose}
      autoCloseDelay={autoCloseDelay}
      allowBackdropClose={actions.length === 0}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      
      {/* Contenido personalizado */}
      <View style={[styles.contentContainer, contentStyle]}>
        {children}
      </View>
      
      {/* Botones de acción */}
      {actions.length > 0 && (
        <View style={[
          styles.actionsContainer,
          actions.length === 1 ? styles.singleAction : styles.multipleActions
        ]}>
          {actions.map(renderAction)}
        </View>
      )}
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
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 14,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  actionsContainer: {
    marginTop: 20,
    width: '100%',
  },
  singleAction: {
    alignItems: 'center',
  },
  multipleActions: {
    flexDirection: 'row',
    gap: defaultAlertTheme.spacing.buttonGap,
    justifyContent: 'center',
  },
  button: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    maxWidth: 130,
  },
  primaryButton: {
    backgroundColor: defaultAlertTheme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: defaultAlertTheme.colors.secondary,
  },
  destructiveButton: {
    backgroundColor: defaultAlertTheme.colors.error,
  },
  buttonText: {
    fontFamily: defaultAlertTheme.fonts.primary,
    fontSize: defaultAlertTheme.fonts.sizes.button,
  },
}); 