import { ReactNode } from "react";

// Base props que todos los alerts comparten
export interface BaseAlertProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: AlertVariant;
  icon?: AlertIcon;
  position?: AlertPosition;
  autoClose?: boolean;
  autoCloseDelay?: number;
  allowBackdropClose?: boolean;
  theme?: AlertThemeName;
}

// Variantes de estilo
export type AlertVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "destructive";

// Iconos disponibles
export type AlertIcon =
  | "logo"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "tree"
  | "coin"
  | "nft"
  | "none";

// Posiciones en pantalla
export type AlertPosition = "center" | "top" | "bottom";

// Nombres de temas disponibles
export type AlertThemeName = "default" | "focus" | "friends" | "sessionLost";

// Configuración de tema
export interface AlertTheme {
  colors: {
    background: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  fonts: {
    primary: string;
    sizes: {
      title: number;
      message: number;
      button: number;
      input: number;
    };
  };
  spacing: {
    padding: number;
    margin: number;
    buttonGap: number;
  };
  animation: {
    duration: number;
    easing: any;
  };
  // Optional new properties for specific themes
  positioning?: {
    top: string;
    paddingHorizontal: number;
  };
  styling?: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
    maxWidth: string;
    minWidth: number;
  };
  typography?: {
    title: {
      fontSize: number;
      fontFamily: string;
      color: string;
      lineHeight: number;
      textAlign: "center" | "left" | "right";
      marginBottom: number;
    };
    subtitle: {
      fontSize: number;
      fontFamily: string;
      color: string;
      lineHeight: number;
      textAlign: "center" | "left" | "right";
      marginBottom: number;
    };
  };
  buttons?: {
    gap: number;
    button: {
      borderRadius: number;
      borderWidth: number;
      borderColor: string;
      paddingVertical: number;
      paddingHorizontal: number;
      minWidth: number;
      alignItems: "center" | "flex-start" | "flex-end";
    };
    confirm: {
      backgroundColor: string;
    };
    cancel: {
      backgroundColor: string;
    };
    destructive: {
      backgroundColor: string;
    };
    text: {
      fontSize: number;
      fontFamily: string;
      color: string;
    };
  };
  input?: {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    paddingVertical: number;
    paddingHorizontal: number;
    fontFamily: string;
    fontSize: number;
    color: string;
    textAlign: "center" | "left" | "right";
    marginBottom: number;
  };
}

// Alert de confirmación (Sí/No)
export interface ConfirmAlertProps extends BaseAlertProps {
  type: "confirm";
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  isLoading?: boolean;
  destructive?: boolean; // Para acciones peligrosas
}

// Alert con input de texto
export interface InputAlertProps extends BaseAlertProps {
  type: "input";
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  maxLength?: number;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  errorMessage?: string;
  validation?: (value: string) => string | null;
}

// Alert solo informativo (solo botón OK)
export interface InfoAlertProps extends BaseAlertProps {
  type: "info";
  buttonText?: string;
  subtitle?: string;
  onButtonPress?: () => void;
}

// Alert con loading/progress
export interface LoadingAlertProps extends BaseAlertProps {
  type: "loading";
  progress?: number; // 0-100 para progress bar
  loadingText?: string;
  allowCancel?: boolean;
  onCancel?: () => void;
}

// Alert personalizado con contenido libre
export interface CustomAlertProps extends BaseAlertProps {
  type: "custom";
  children: ReactNode;
  actions?: AlertAction[];
  contentStyle?: any;
}

// Acción de botón
export interface AlertAction {
  text: string;
  onPress: () => void;
  style?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  loading?: boolean;
}

// Union type de todas las props
export type AlertProps =
  | ConfirmAlertProps
  | InputAlertProps
  | InfoAlertProps
  | LoadingAlertProps
  | CustomAlertProps;

// Estado del alert en el contexto
export interface AlertState {
  id: string;
  props: AlertProps;
  timestamp: number;
}

// Configuración para mostrar un alert
export interface ShowAlertConfig {
  id?: string;
  props: Omit<AlertProps, "show" | "onClose">;
  priority?: number; // Para manejar cola de alerts
}

// Context type
export interface AlertContextType {
  alerts: AlertState[];
  showAlert: (config: ShowAlertConfig) => string; // Retorna ID del alert
  hideAlert: (id: string) => void;
  hideAllAlerts: () => void;
  updateAlert: (id: string, props: Partial<AlertProps>) => void;
}

// Hook result type
export interface UseAlertResult {
  showConfirmAlert: (
    props: Omit<ConfirmAlertProps, "type" | "show" | "onClose" | "onConfirm">
  ) => Promise<boolean>;
  showInputAlert: (
    props: Omit<InputAlertProps, "type" | "show" | "onClose" | "onSubmit">
  ) => Promise<string | null>;
  showInfoAlert: (
    props: Omit<InfoAlertProps, "type" | "show" | "onClose">
  ) => Promise<void>;
  showLoadingAlert: (
    props: Omit<LoadingAlertProps, "type" | "show" | "onClose">
  ) => string;
  showCustomAlert: (
    props: Omit<CustomAlertProps, "type" | "show" | "onClose">
  ) => string;
  hideAlert: (id: string) => void;
  hideAllAlerts: () => void;
  updateLoadingAlert: (
    id: string,
    props: { progress?: number; loadingText?: string }
  ) => void;
}
