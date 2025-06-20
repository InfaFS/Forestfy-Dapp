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
    subtitle?: string;
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
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 0);
  }, []);

  const hideAllAlerts = useCallback(() => {
    setTimeout(() => {
      setAlerts([]);
    }, 0);
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

        setTimeout(() => {
          setAlerts((prev) => [
            ...prev,
            {
              id,
              type: "confirm",
              props: alertProps,
              resolve,
            },
          ]);
        }, 0);
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

        const alertProps = {
          ...config,
          type: "input" as const,
          show: true,
          onClose: () => {
            hideAlert(id);
            resolve(null);
          },
          onSubmit: (value: string) => {
            hideAlert(id);
            resolve(value);
          },
        };

        setTimeout(() => {
          setAlerts((prev) => [
            ...prev,
            {
              id,
              type: "input",
              props: alertProps,
              resolve,
            },
          ]);
        }, 0);
      });
    },
    [hideAlert]
  );

  const showInfoAlert = useCallback(
    (config: {
      title?: string;
      message?: string;
      subtitle?: string;
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

        setTimeout(() => {
          setAlerts((prev) => [
            ...prev,
            {
              id,
              type: "info",
              props: alertProps,
              resolve,
            },
          ]);
        }, 0);
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

      setTimeout(() => {
        setAlerts((prev) => [
          ...prev,
          {
            id,
            type: "loading",
            props: alertProps,
          },
        ]);
      }, 0);

      return id;
    },
    [hideAlert]
  );

  const updateLoadingAlert = useCallback(
    (id: string, updates: { progress?: number; loadingText?: string }) => {
      setTimeout(() => {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id
              ? {
                  ...alert,
                  props: {
                    ...alert.props,
                    ...updates,
                  },
                }
              : alert
          )
        );
      }, 0);
    },
    []
  );

  return {
    showConfirmAlert,
    showInputAlert,
    showInfoAlert,
    showLoadingAlert,
    hideAlert,
    hideAllAlerts,
    updateLoadingAlert,
    _alerts: alerts,
  };
};
