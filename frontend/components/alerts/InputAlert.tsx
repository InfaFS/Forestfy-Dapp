import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { BaseAlert } from './BaseAlert';
import { InputAlertProps } from '@/types/alerts';
import { defaultAlertTheme, getVariantColors } from '@/constants/AlertTheme';

export const InputAlert: React.FC<InputAlertProps> = ({
  show,
  onClose,
  onSubmit,
  onCancel,
  inputValue: initialValue = '',
  onInputChange,
  title = "Enter Information",
  message,
  placeholder = "Enter text...",
  maxLength = 50,
  submitText = "Submit",
  cancelText = "Cancel",
  isLoading = false,
  errorMessage,
  validation,
  variant = 'neutral',
  icon = 'logo',
  position = 'center',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [localInputValue, setLocalInputValue] = useState<string>(initialValue);
  const colors = getVariantColors(variant);

  // Reset local error when input changes
  useEffect(() => {
    if (localError && localInputValue !== '') {
      setLocalError('');
    }
  }, [localInputValue, localError]);

  // Reset everything when alert opens
  useEffect(() => {
    if (show) {
      setLocalError('');
      setLocalInputValue(initialValue);
    }
  }, [show, initialValue]);

  const handleInputChange = (value: string) => {
    setLocalInputValue(value);
    if (onInputChange) {
      onInputChange(value);
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;

    // Validate if validation function provided
    if (validation) {
      const error = validation(localInputValue);
      if (error) {
        setLocalError(error);
        return;
      }
    }

    // Basic validation
    if (!localInputValue.trim()) {
      setLocalError('This field is required');
      return;
    }

    onSubmit(localInputValue.trim());
  };

  const handleCancel = () => {
    if (isLoading) return;
    
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const displayError = errorMessage || localError;
  const isSubmitDisabled = !localInputValue.trim() || isLoading || !!displayError;

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
      
      <TextInput
        style={[
          styles.input,
          displayError ? styles.inputError : null
        ]}
        value={localInputValue}
        onChangeText={handleInputChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoFocus={show}
        maxLength={maxLength}
        editable={!isLoading}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      
      {displayError && (
        <Text style={styles.errorText}>{displayError}</Text>
      )}
      
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
            styles.submitButton,
            { 
              backgroundColor: colors.primary,
              opacity: isSubmitDisabled ? 0.5 : 1 
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {isLoading ? "..." : submitText}
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
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: defaultAlertTheme.colors.border,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: defaultAlertTheme.fonts.sizes.input,
    fontFamily: defaultAlertTheme.fonts.primary,
    color: defaultAlertTheme.colors.text,
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputError: {
    borderColor: defaultAlertTheme.colors.error,
  },
  errorText: {
    color: defaultAlertTheme.colors.error,
    fontSize: 8,
    fontFamily: defaultAlertTheme.fonts.primary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 12,
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
  submitButton: {
    backgroundColor: defaultAlertTheme.colors.primary,
  },
  buttonText: {
    fontFamily: defaultAlertTheme.fonts.primary,
    fontSize: defaultAlertTheme.fonts.sizes.button,
  },
}); 