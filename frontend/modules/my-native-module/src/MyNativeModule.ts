import { NativeModule, requireNativeModule } from "expo";

import {
  MyNativeModuleEvents,
  DeviceInfo,
  BiometricResultPayload,
  FileOperationResult,
} from "./MyNativeModule.types";

declare class MyNativeModule extends NativeModule<MyNativeModuleEvents> {
  // Constants
  PI: number;

  // Basic functions
  hello(): string;
  setValueAsync(value: string): Promise<void>;

  // Device Information
  getDeviceInfo(): Promise<DeviceInfo>;
  getBatteryLevel(): Promise<number>;
  isDeviceCharging(): Promise<boolean>;

  // Biometric Authentication
  isBiometricAvailable(): Promise<boolean>;
  authenticateWithBiometrics(reason: string): Promise<BiometricResultPayload>;

  // Haptic Feedback
  triggerHapticFeedback(
    type: "light" | "medium" | "heavy" | "success" | "warning" | "error"
  ): void;

  // File Operations
  saveToDocuments(
    filename: string,
    content: string
  ): Promise<FileOperationResult>;
  readFromDocuments(filename: string): Promise<string>;
  deleteFromDocuments(filename: string): Promise<boolean>;

  // Device Controls
  enableShakeDetection(): void;
  disableShakeDetection(): void;
  setScreenBrightness(level: number): Promise<boolean>;

  // Network & Connectivity
  getNetworkInfo(): Promise<{
    type: string;
    isConnected: boolean;
    isWiFi: boolean;
  }>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MyNativeModule>("MyNativeModule");
