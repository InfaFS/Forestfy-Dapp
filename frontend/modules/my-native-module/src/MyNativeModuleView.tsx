import { requireNativeView } from 'expo';
import * as React from 'react';

import { MyNativeModuleViewProps } from './MyNativeModule.types';

const NativeView: React.ComponentType<MyNativeModuleViewProps> =
  requireNativeView('MyNativeModule');

export default function MyNativeModuleView(props: MyNativeModuleViewProps) {
  return <NativeView {...props} />;
}
