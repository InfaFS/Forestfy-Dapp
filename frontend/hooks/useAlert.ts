import { useState, useCallback, useRef } from "react";

interface AlertState {
  id: string;
  type: "confirm" | "input" | "info" | "loading" | "custom";
  props: any;
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
}

export interface UseAlertResult {
  showConfirmAlert: (config: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    destructive?: boolean;
    variant?: string;
    icon?: string;
    position?: string;
    theme?: string;
  }) => Promise<boolean>;

  showInputAlert: (config: {
    title?: string;
    message?: string;
    placeholder?: string;
    maxLength?: number;
    submitText?: string;
    cancelText?: string;
    errorMessage?: string;
    validation?: (value: string) => string | null;
    variant?: string;
    icon?: string;
    position?: string;
    theme?: string;
  }) => Promise<string | null>;

  showInfoAlert: (config: {
    title?: string;
    message?: string;
    buttonText?: string;
    variant?: string;
    icon?: string;
    position?: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
    theme?: string;
  }) => Promise<void>;

  showLoadingAlert: (config: {
    title?: string;
    message?: string;
    loadingText?: string;
    allowCancel?: boolean;
    variant?: string;
    icon?: string;
    position?: string;
  }) => string;

  hideAlert: (id: string) => void;
  hideAllAlerts: () => void;
  updateLoadingAlert: (
    id: string,
    updates: { progress?: number; loadingText?: string }
  ) => void;
  _alerts: any[]; // Para el renderer
}

export const useAlert = (): UseAlertResult => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const idCounter = useRef(0);

  const generateId = () => {
    idCounter.current += 1;
    return `alert_${idCounter.current}_${Date.now()}`;
  };

  const hideAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const hideAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const showConfirmAlert = useCallback(
    (config: {
      title?: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
      confirmColor?: string;
      destructive?: boolean;
      variant?: string;
      icon?: string;
      position?: string;
      theme?: string;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        const id = generateId();

        const alertProps = {
          ...config,
          type: "confirm" as const,
          show: true,
          onClose: () => {
            hideAlert(id);
            resolve(false);
          },
          onConfirm: () => {
            hideAlert(id);
            resolve(true);
          },
        };

        setAlerts((prev) => [
          ...prev,
          {
            id,
            type: "confirm",
            props: alertProps,
            resolve,
          },
        ]);
      });
    },
    [hideAlert]
  );

  const showInputAlert = useCallback(
    (config: {
      title?: string;
      message?: string;
      placeholder?: string;
      maxLength?: number;
      submitText?: string;
      cancelText?: string;
      errorMessage?: string;
      validation?: (value: string) => string | null;
      variant?: string;
      icon?: string;
      position?: string;
      theme?: string;
    }): Promise<string | null> => {
      return new Promise((resolve) => {
        const id = generateId();
        let inputValue = "";

        const alertProps = {
          ...config,
          type: "input" as const,
          show: true,
          inputValue,
          onInputChange: (value: string) => {
            inputValue = value;
            // Actualizar el estado del alert
            setAlerts((prev) =>
              prev.map((alert) => {
                if (alert.id === id) {
                  return {
                    ...alert,
                    props: {
                      ...alert.props,
                      inputValue: value,
                    },
                  };
                }
                return alert;
              })
            );
          },
          onClose: () => {
            hideAlert(id);
            resolve(null);
          },
          onSubmit: (value: string) => {
            hideAlert(id);
            resolve(value);
          },
        };

        setAlerts((prev) => [
          ...prev,
          {
            id,
            type: "input",
            props: alertProps,
            resolve,
          },
        ]);
      });
    },
    [hideAlert]
  );

  const showInfoAlert = useCallback(
    (config: {
      title?: string;
      message?: string;
      buttonText?: string;
      variant?: string;
      icon?: string;
      position?: string;
      autoClose?: boolean;
      autoCloseDelay?: number;
      theme?: string;
    }): Promise<void> => {
      return new Promise((resolve) => {
        const id = generateId();

        const alertProps = {
          ...config,
          type: "info" as const,
          show: true,
          onClose: () => {
            hideAlert(id);
            resolve();
          },
          onButtonPress: () => {
            hideAlert(id);
            resolve();
          },
        };

        setAlerts((prev) => [
          ...prev,
          {
            id,
            type: "info",
            props: alertProps,
            resolve,
          },
        ]);
      });
    },
    [hideAlert]
  );

  const showLoadingAlert = useCallback(
    (config: {
      title?: string;
      message?: string;
      loadingText?: string;
      allowCancel?: boolean;
      variant?: string;
      icon?: string;
      position?: string;
    }): string => {
      const id = generateId();

      const alertProps = {
        ...config,
        type: "loading" as const,
        show: true,
        onClose: () => {
          hideAlert(id);
        },
        onCancel: config.allowCancel
          ? () => {
              hideAlert(id);
            }
          : undefined,
      };

      setAlerts((prev) => [
        ...prev,
        {
          id,
          type: "loading",
          props: alertProps,
        },
      ]);

      return id;
    },
    [hideAlert]
  );

  const updateLoadingAlert = useCallback(
    (id: string, updates: { progress?: number; loadingText?: string }) => {
      setAlerts((prev) =>
        prev.map((alert) => {
          if (alert.id === id && alert.type === "loading") {
            return {
              ...alert,
              props: {
                ...alert.props,
                ...updates,
              },
            };
          }
          return alert;
        })
      );
    },
    []
  );

  // Exponer los alerts para el renderer
  const alertsToRender = alerts.map((alert) => ({
    id: alert.id,
    type: alert.type,
    props: alert.props,
  }));

  return {
    showConfirmAlert,
    showInputAlert,
    showInfoAlert,
    showLoadingAlert,
    hideAlert,
    hideAllAlerts,
    updateLoadingAlert,
    _alerts: alertsToRender,
  };
};
