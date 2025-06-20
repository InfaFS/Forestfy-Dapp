import React from 'react';
import { ConfirmAlert } from './ConfirmAlert';
import { InfoAlert } from './InfoAlert';
import { InputAlert } from './InputAlert';
import { LoadingAlert } from './LoadingAlert';
import { CustomAlert } from './CustomAlert';

interface AlertToRender {
  id: string;
  type: 'confirm' | 'input' | 'info' | 'loading' | 'custom';
  props: any;
}

interface AlertRendererProps {
  alerts: AlertToRender[];
}

export const AlertRenderer: React.FC<AlertRendererProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return null;
  }

  // Solo mostrar el alert más reciente (último en la lista)
  const currentAlert = alerts[alerts.length - 1];

  const renderAlert = () => {
    switch (currentAlert.type) {
      case 'confirm':
        return <ConfirmAlert key={currentAlert.id} {...currentAlert.props} />;
      case 'info':
        return <InfoAlert key={currentAlert.id} {...currentAlert.props} />;
      case 'input':
        return <InputAlert key={currentAlert.id} {...currentAlert.props} />;
      case 'loading':
        return <LoadingAlert key={currentAlert.id} {...currentAlert.props} />;
      case 'custom':
        return <CustomAlert key={currentAlert.id} {...currentAlert.props} />;
      default:
        return null;
    }
  };

  return renderAlert();
}; 