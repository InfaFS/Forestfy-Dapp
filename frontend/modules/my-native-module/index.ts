// Reexport the native module. On web, it will be resolved to MyNativeModule.web.ts
// and on native platforms to MyNativeModule.ts
export { default } from './src/MyNativeModule';
export { default as MyNativeModuleView } from './src/MyNativeModuleView';
export * from  './src/MyNativeModule.types';
