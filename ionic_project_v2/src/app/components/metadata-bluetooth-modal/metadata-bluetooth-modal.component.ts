import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  BleMetadataPeripheral, BLE_METADATA_SERVICE, BLE_METADATA_DATA,
  BLE_METADATA_CONTROL, BLE_METADATA_STATUS, MAX_METADATA_BYTES,
} from '../../services/ble-metadata-peripheral';

@Component({
  selector: 'app-metadata-bluetooth-modal',
  templateUrl: './metadata-bluetooth-modal.component.html',
  styleUrls: ['./metadata-bluetooth-modal.component.scss'],
  standalone: false,
})
export class MetadataBluetoothModalComponent implements OnInit, OnDestroy {
  @Input() metadata: Record<string, unknown> | null = null;
  modo: 'enviar' | 'recibir' = 'enviar';
  buscando = false;
  enviando = false;
  anunciando = false;
  estado = '';
  dispositivos: BleDevice[] = [];
  metadataRecibida: Record<string, unknown> | null = null;
  private listeners: PluginListenerHandle[] = [];
  private activeDeviceId: string | null = null;
  private destroyed = false;
  private scanActive = false;
  private scanCancel: (() => void) | null = null;
  private pendingPrompt = false;

  constructor(
    private modal: ModalController,
    private toast: ToastController,
    private alerts: AlertController,
    private zone: NgZone,
  ) {}

  async ngOnInit() {
    if (Capacitor.getPlatform() !== 'android') {
      this.estado = 'El modo receptor funciona en una compilación Android, no en ionic serve.';
      return;
    }
    try {
      this.listeners.push(await BleMetadataPeripheral.addListener('incomingConnection', info => {
        this.zone.run(() => void this.preguntarConexion(info));
      }));
      this.listeners.push(await BleMetadataPeripheral.addListener('metadataReceived', data => {
        this.zone.run(() => {
          if (!this.anunciando || !data.metadata) return;
          this.metadataRecibida = data.metadata;
          this.estado = 'Metadata recibida correctamente. No se guardó la imagen.';
          void this.aviso('Metadata recibida en el celular B.');
        });
      }));
      this.listeners.push(await BleMetadataPeripheral.addListener('peerDisconnected', () => {
        this.zone.run(() => { if (this.anunciando) this.estado = 'El celular A se desconectó. Continúas visible para nuevos envíos.'; });
      }));
    } catch (err) {
      this.estado = 'No se pudo preparar el receptor BLE: ' + this.errorText(err);
    }
  }

  async cambioModo() {
    await this.detenerBusqueda();
    if (this.modo !== 'recibir') await this.detenerReceptor();
    this.dispositivos = [];
    this.estado = '';
  }

  async buscar() {
    if (this.buscando || this.enviando) return;
    if (!this.esAndroid()) return this.aviso('Para Bluetooth real abre la app compilada en un celular Android.');
    this.buscando = true;
    this.dispositivos = [];
    this.estado = 'Buscando teléfonos con la app abierta en modo Recibir…';
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      await BleClient.requestLEScan({ services: [BLE_METADATA_SERVICE] }, result => {
        if (this.destroyed || !this.buscando) return;
        this.zone.run(() => {
          if (!this.dispositivos.some(item => item.deviceId === result.device.deviceId)) {
            this.dispositivos = [...this.dispositivos, result.device];
          }
        });
      });
      this.scanActive = true;
      await new Promise<void>(resolve => {
        const timer = setTimeout(() => { this.scanCancel = null; resolve(); }, 10000);
        this.scanCancel = () => { clearTimeout(timer); this.scanCancel = null; resolve(); };
      });
      if (!this.dispositivos.length && !this.destroyed) this.estado = 'No se encontró ningún receptor. Activa «Permitir recepción» en el celular B.';
    } catch (err) {
      this.estado = 'Error de búsqueda: ' + this.errorText(err);
      await this.aviso(this.estado);
    } finally {
      await this.detenerBusqueda();
    }
  }

  async conectar(device: BleDevice) {
    if (this.enviando) return;
    if (!this.metadata || !Object.keys(this.metadata).length) {
      return this.aviso('Selecciona una foto con metadata Exif en Mi perfil antes de enviar.');
    }
    const bytes = new TextEncoder().encode(JSON.stringify(this.metadata));
    if (bytes.length > MAX_METADATA_BYTES) {
      return this.aviso(`Metadata demasiado grande (${bytes.length} bytes). Máximo ${MAX_METADATA_BYTES}.`);
    }
    const alert = await this.alerts.create({
      header: 'Enviar metadata Exif',
      message: 'Los datos Exif pueden contener ubicación GPS, fecha y modelo de cámara. Se compartirán todos los campos mostrados en tu perfil. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Enviar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm' || this.destroyed) return;
    this.enviando = true;
    this.estado = 'Conectando con el teléfono receptor…';
    try {
      await this.detenerBusqueda();
      await BleClient.initialize({ androidNeverForLocation: true });
      this.activeDeviceId = device.deviceId;
      await BleClient.connect(device.deviceId, () => this.zone.run(() => {
        this.estado = 'El receptor se ha desconectado.';
      }));
      this.estado = 'Conectado. Esperando a que el celular B autorice la conexión…';
      await this.esperarEstado(device.deviceId, 'ACCEPTED', 60000);
      this.estado = 'Permiso concedido. Enviando metadata…';
      await BleClient.write(device.deviceId, BLE_METADATA_SERVICE, BLE_METADATA_CONTROL, this.vista(new TextEncoder().encode(`START:${bytes.length}`)));
      let mtu = 23;
      try { mtu = await BleClient.getMtu(device.deviceId); } catch { /* MTU básico BLE */ }
      const size = Math.max(18, Math.min(160, mtu - 3));
      for (let off = 0; off < bytes.length; off += size) {
        if (this.destroyed) throw new Error('Modal cerrada.');
        await BleClient.write(device.deviceId, BLE_METADATA_SERVICE, BLE_METADATA_DATA, this.vista(bytes.subarray(off, off + size)));
        this.zone.run(() => this.estado = `Enviando… ${Math.min(100, Math.floor((off + size) * 100 / bytes.length))}%`);
      }
      await this.esperarEstado(device.deviceId, 'RECEIVED', 15000);
      this.estado = 'Transferencia completada y confirmada por el celular B.';
      await this.aviso('Metadata entregada correctamente.');
    } catch (err) {
      this.estado = 'No se completó el envío: ' + this.errorText(err);
      await this.aviso(this.estado);
    } finally {
      this.enviando = false;
      try { await BleClient.disconnect(device.deviceId); } catch { /* ya desconectado */ }
      this.activeDeviceId = null;
    }
  }

  async activarReceptor() {
    if (this.anunciando) return;
    if (!this.esAndroid()) return this.aviso('Se necesita una compilación nativa Android en un teléfono físico.');
    try {
      // Los listeners se registran antes del anuncio para no perder la solicitud de consentimiento.
      await BleMetadataPeripheral.start();
      this.anunciando = true;
      this.estado = 'Visible por Bluetooth. Esperando conexión desde el celular A…';
      this.metadataRecibida = null;
    } catch (err) {
      this.estado = 'No se pudo activar la recepción: ' + this.errorText(err);
      await this.aviso(this.estado);
    }
  }

  async detenerReceptor() {
    if (!this.anunciando) return;
    this.anunciando = false;
    try { await BleMetadataPeripheral.stop(); } catch { /* la app está terminando */ }
    this.estado = 'Recepción Bluetooth desactivada.';
  }

  private async preguntarConexion(info: { requestId: string; device: string }) {
    if (!this.anunciando || this.modo !== 'recibir' || this.pendingPrompt || this.destroyed) {
      try { await BleMetadataPeripheral.respond({ requestId: info.requestId, accept: false }); } catch {}
      return;
    }
    this.pendingPrompt = true;
    const alert = await this.alerts.create({
      header: 'Solicitud Bluetooth',
      message: 'Otro celular quiere enviarte metadata Exif. Puede incluir ubicación GPS y datos de la cámara. ¿Aceptas la conexión y la recepción?',
      backdropDismiss: false,
      buttons: [
        { text: 'Rechazar', role: 'cancel' },
        { text: 'Aceptar', role: 'confirm' },
      ],
    });
    try {
      await alert.present();
      const { role } = await alert.onDidDismiss();
      const accept = role === 'confirm' && this.anunciando && !this.destroyed;
      await BleMetadataPeripheral.respond({ requestId: info.requestId, accept });
      this.estado = accept ? 'Conexión aceptada. Esperando metadata del celular A…' : 'Conexión rechazada. Esperando otra solicitud…';
    } catch (err) {
      this.estado = 'La solicitud de conexión ya no está disponible: ' + this.errorText(err);
    } finally {
      this.pendingPrompt = false;
    }
  }

  private async esperarEstado(deviceId: string, buscado: string, timeoutMs: number) {
    const start = Date.now();
    while (!this.destroyed && Date.now() - start < timeoutMs) {
      const response = await BleClient.read(deviceId, BLE_METADATA_SERVICE, BLE_METADATA_STATUS);
      const status = new TextDecoder().decode(response);
      if (status === buscado) return;
      if (status === 'REJECTED') throw new Error('El celular B rechazó la conexión.');
      if (status === 'ERROR') throw new Error('El receptor rechazó o no pudo interpretar la metadata.');
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    throw new Error(`Se agotó el tiempo esperando ${buscado === 'ACCEPTED' ? 'autorización' : 'confirmación de recepción'}.`);
  }

  private vista(bytes: Uint8Array): DataView {
    return new DataView(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength);
  }

  private async detenerBusqueda() {
    this.scanCancel?.();
    this.buscando = false;
    if (this.scanActive) {
      this.scanActive = false;
      try { await BleClient.stopLEScan(); } catch {}
    }
  }

  async cerrar() {
    await this.limpiar();
    await this.modal.dismiss();
  }

  ngOnDestroy() { void this.limpiar(); }

  private async limpiar() {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.detenerBusqueda();
    await this.detenerReceptor();
    if (this.activeDeviceId) {
      try { await BleClient.disconnect(this.activeDeviceId); } catch {}
      this.activeDeviceId = null;
    }
    for (const handle of this.listeners) {
      try { await handle.remove(); } catch {}
    }
    this.listeners = [];
  }

  esAndroid() { return Capacitor.getPlatform() === 'android'; }
  formatear(value: unknown) {
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value ?? '');
  }
  private errorText(error: unknown) { return error instanceof Error ? error.message : String(error); }
  private async aviso(message: string) {
    if (this.destroyed) return;
    const toast = await this.toast.create({ message, duration: 4200, position: 'bottom' });
    await toast.present();
  }
}
