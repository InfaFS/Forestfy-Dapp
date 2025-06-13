import * as React from 'react';

import { MyNativeModuleViewProps } from './MyNativeModule.types';

export default function MyNativeModuleView(props: MyNativeModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
