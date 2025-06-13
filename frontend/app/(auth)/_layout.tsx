import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        animationDuration: 200,
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
} 