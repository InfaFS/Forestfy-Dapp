import type { StyleProp, ViewStyle } from "react-native";

export type OnLoadEventPayload = {
  url: string;
};

export type MyNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onDeviceShaken: () => void;
  onBiometricResult: (params: BiometricResultPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type BiometricResultPayload = {
  success: boolean;
  error?: string;
  biometricType?: "touchID" | "faceID" | "fingerprint" | "none";
};

export type DeviceInfo = {
  platform: string;
  version: string;
  model: string;
  uniqueId: string;
  battery: number;
  isCharging: boolean;
};

export type MyNativeModuleViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

export type FileOperationResult = {
  success: boolean;
  path?: string;
  error?: string;
};
