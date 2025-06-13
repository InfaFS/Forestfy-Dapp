import { Stack } from 'expo-router';
import React from 'react';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 200,
      }}
    >
      <Stack.Screen 
        name="user-nfts" 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
} 