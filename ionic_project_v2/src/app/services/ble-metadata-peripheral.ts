import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

/** Contrato con BleMetadataPeripheralPlugin.java (solo Android). */
export interface PeripheralBleMetadata {
  start(): Promise<void>;
  stop(): Promise<void>;
  respond(options: { requestId: string; accept: boolean }): Promise<void>;
  addListener(eventName: 'incomingConnection', listener: (data: { requestId: string; device: string }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'metadataReceived', listener: (data: { metadata: Record<string, unknown> }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'peerDisconnected', listener: () => void): Promise<PluginListenerHandle>;
}
export const BleMetadataPeripheral = registerPlugin<PeripheralBleMetadata>('BleMetadataPeripheral');
export const BLE_METADATA_SERVICE = '7d2ea28a-f7bd-485a-bd9d-92ad6ecfe93e';
export const BLE_METADATA_DATA = '7d2ea28b-f7bd-485a-bd9d-92ad6ecfe93e';
export const BLE_METADATA_STATUS = '7d2ea28c-f7bd-485a-bd9d-92ad6ecfe93e';
export const BLE_METADATA_CONTROL = '7d2ea28d-f7bd-485a-bd9d-92ad6ecfe93e';
export const MAX_METADATA_BYTES = 12000;
