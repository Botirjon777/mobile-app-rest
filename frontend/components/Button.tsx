import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ButtonProps } from '../types';

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  disabled, 
  loading, 
  variant = 'primary', 
  style 
}) => {
  const buttonStyle: ViewStyle[] = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.buttonText,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'outline' && styles.buttonTextOutline,
    disabled && styles.buttonTextDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#D1D1D6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: '#007AFF',
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
});