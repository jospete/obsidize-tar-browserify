export { SerializationDuplex, getJSONSerializationDuplex } from './core/serialization-duplex';
export { StorageContextEntityArray } from './core/storage-context-entity-array';
export { StorageContextEntityMap } from './core/storage-context-entity-map';
export { StorageContextEntityOptions, getDefaultStorageContextEntityOptions } from './core/storage-context-entity-options';
export { StorageContextEntity } from './core/storage-context-entity';
export { StorageContextKeyValuePair } from './core/storage-context-key-value-pair';
export { StorageContextOptions, getDefaultStorageContextOptions } from './core/storage-context-options';
export { StorageContextUtility } from './core/storage-context-utility';
export { StorageContext } from './core/storage-context';
export { StorageTransportApiMask } from './core/storage-transport-api-mask';

export { BrowserStorageTransport } from './transports/browser-storage-transport';
export { IonicNativeStorageLike, IonicNativeStorageTransport } from './transports/ionic-native-storage-transport';
export { MockBrowserStorage } from './transports/mock-browser-storage';
export { MockIonicNativeStorage } from './transports/mock-ionic-native-storage';
export { ProxyStorageTransport } from './transports/proxy-storage-transport';