import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './MyNativeModule.types';

type MyNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class MyNativeModule extends NativeModule<MyNativeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(MyNativeModule, 'MyNativeModule');
