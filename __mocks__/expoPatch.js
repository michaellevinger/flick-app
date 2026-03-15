// Prevent expo/src/winter/installGlobal.ts from crashing Jest.
// installGlobal.ts defines lazy getters for globals like __ExpoImportMetaRegistry
// and structuredClone that load runtime.native.ts (an ESM file incompatible with
// Jest's CommonJS transform). We override them with safe stubs.

Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: {},
  writable: true,
  configurable: true,
});

// structuredClone is natively available in Node 17+, but expo re-defines it as
// a lazy getter. Override it back to a native-compatible implementation.
if (!global.structuredClone || Object.getOwnPropertyDescriptor(global, 'structuredClone')?.get) {
  Object.defineProperty(global, 'structuredClone', {
    value: (obj) => JSON.parse(JSON.stringify(obj)),
    writable: true,
    configurable: true,
  });
}
