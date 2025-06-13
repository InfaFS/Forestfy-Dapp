# Forestfy Custom Native Module

A comprehensive Expo module that provides native functionality for iOS and Android platforms.

## Features

### 🔋 Device Information

- Get device platform, version, model, and unique ID
- Real-time battery level monitoring
- Charging status detection

### 🔐 Biometric Authentication

- Check biometric availability (Face ID, Touch ID, Fingerprint)
- Authenticate users with biometrics
- Support for different biometric types

### 📳 Haptic Feedback

- Multiple haptic feedback types:
  - Impact: `light`, `medium`, `heavy`
  - Notification: `success`, `warning`, `error`

### 📁 File Operations

- Save files to device documents directory
- Read files from documents directory
- Delete files from documents directory

### 🎯 Motion Detection

- Shake detection with customizable sensitivity
- Real-time accelerometer data processing

### 🌐 Network Information

- Network connectivity status
- Connection type detection

## Installation

The module is automatically linked when you run:

```bash
npx expo run:ios
# or
npx expo run:android
```

## Usage

```typescript
import MyNativeModule from "./modules/my-native-module";

// Device Information
const deviceInfo = await MyNativeModule.getDeviceInfo();
const batteryLevel = await MyNativeModule.getBatteryLevel();
const isCharging = await MyNativeModule.isDeviceCharging();

// Biometric Authentication
const isBiometricAvailable = await MyNativeModule.isBiometricAvailable();
const authResult = await MyNativeModule.authenticateWithBiometrics(
  "Please authenticate"
);

if (authResult.success) {
  console.log(`Authenticated with ${authResult.biometricType}`);
}

// Haptic Feedback
MyNativeModule.triggerHapticFeedback("success");

// File Operations
const saveResult = await MyNativeModule.saveToDocuments(
  "myfile.txt",
  "Hello World"
);
const content = await MyNativeModule.readFromDocuments("myfile.txt");
const deleted = await MyNativeModule.deleteFromDocuments("myfile.txt");

// Motion Detection
MyNativeModule.addListener("onDeviceShaken", () => {
  console.log("Device was shaken!");
});
MyNativeModule.enableShakeDetection();

// Clean up
MyNativeModule.disableShakeDetection();
```

## Event Listeners

```typescript
// Shake detection
const shakeSubscription = MyNativeModule.addListener("onDeviceShaken", () => {
  console.log("Device shaken!");
});

// Biometric results (if using async events)
const biometricSubscription = MyNativeModule.addListener(
  "onBiometricResult",
  (result) => {
    console.log("Biometric result:", result);
  }
);

// Clean up
shakeSubscription?.remove();
biometricSubscription?.remove();
```

## Building with Custom Native Code

1. **Generate native directories** (if not already done):

   ```bash
   npx expo prebuild
   ```

2. **Run on iOS**:

   ```bash
   npx expo run:ios
   ```

3. **Run on Android**:

   ```bash
   npx expo run:android
   ```

4. **Build for distribution**:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

## iOS Permissions

Add these permissions to your `ios/[AppName]/Info.plist` if needed:

```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for secure authentication</string>
<key>NSMotionUsageDescription</key>
<string>This app uses motion sensors for shake detection</string>
```

## Android Permissions

Add these permissions to your `android/app/src/main/AndroidManifest.xml` if needed:

```xml
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## Development

### Adding New Functions

1. **Update TypeScript types** in `src/MyNativeModule.types.ts`
2. **Update interface** in `src/MyNativeModule.ts`
3. **Implement iOS functionality** in `ios/MyNativeModule.swift`
4. **Implement Android functionality** in `android/src/main/java/expo/modules/mynativemodule/MyNativeModule.kt`

### Testing

Run the demo app to test all functionality:

```bash
npm run start
# Then press 'i' for iOS or 'a' for Android
```

## Native Implementation Details

### iOS (Swift)

- Uses `UIDevice` for device information
- Uses `LocalAuthentication` framework for biometrics
- Uses `UIImpactFeedbackGenerator` for haptics
- Uses `CoreMotion` for shake detection
- Uses `FileManager` for file operations

### Android (Kotlin)

- Uses `Build` class for device information
- Uses `BiometricPrompt` for biometric authentication
- Uses `Vibrator` for haptic feedback
- Uses `SensorManager` for motion detection
- Uses standard file I/O for file operations

## Troubleshooting

### Common Issues

1. **Module not found**: Make sure you've run `npx expo run:ios` or `npx expo run:android` after adding the module
2. **Biometric not working**: Check device permissions and ensure the device has biometric hardware
3. **File operations failing**: Verify app has write permissions to documents directory
4. **Shake detection not working**: Ensure motion permissions are granted

### Debug Logs

Enable debug logging by adding this to your app:

```typescript
import { LogLevel, logger } from "expo-modules-core";

logger.setLogLevel(LogLevel.Debug);
```

## License

This module is part of the Forestfy project and follows the same license terms.
