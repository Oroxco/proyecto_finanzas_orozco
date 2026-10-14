import { Injectable } from '@angular/core';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

export interface FotoGuardada {
  /** URI real entregada por el almacenamiento nativo; el navegador no expone una ruta. */
  uri: string | null;
  /** Ruta bajo Directory.Data, vacía cuando se solicita una descarga en el navegador. */
  rutaRelativa: string;
  nombre: string;
  webUrl: string;
  /** En web indica que se solicitó una descarga; su destino lo decide el navegador. */
  guardadoEnNavegador: boolean;
}

const CODIGOS_CANCELACION_CAMARA = new Set([
  'OS-PLUG-CAMR-0006',
  'OS-PLUG-CAMR-0013',
  'OS-PLUG-CAMR-0017',
  'OS-PLUG-CAMR-0020',
]);

/** La cancelación del usuario no debe ocultar permisos denegados ni fallos de cámara. */
export function esCancelacionCamara(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string' && code.startsWith('OS-PLUG-CAMR-')) {
      return CODIGOS_CANCELACION_CAMARA.has(code);
    }
  }
  const message = typeof error === 'string'
    ? error
    : typeof error === 'object' && error !== null && 'message' in error
      && typeof error.message === 'string' ? error.message : '';
  return /\b(?:cancelled|canceled|cancelado|cancelada)\b/i.test(message);
}

@Injectable({ providedIn: 'root' })
export class FotoEditorService {
  async capturarFoto(): Promise<string> {
    const foto = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      direction: CameraDirection.Rear,
      quality: 90,
      allowEditing: false,
      saveToGallery: false,
      webUseInput: false,
      width: 2048,
      height: 2048,
    });
    if (!foto.dataUrl) {
      throw new Error('La cámara no devolvió una imagen para editar.');
    }
    return foto.dataUrl;
  }

  async guardarFoto(dataUrl: string): Promise<FotoGuardada> {
    const { base64, bytes } = this.leerJpeg(dataUrl);
    const fecha = new Date().toISOString().replace(/[:.]/g, '-');
    const nombre = `foto-${fecha}_${this.crearUuid()}.jpg`;

    if (!Capacitor.isNativePlatform()) {
      this.descargarJpeg(bytes, nombre);
      return {
        uri: null,
        rutaRelativa: '',
        nombre,
        webUrl: dataUrl,
        guardadoEnNavegador: true,
      };
    }

    const rutaRelativa = `fotos-editadas/${nombre}`;
    const { uri } = await Filesystem.writeFile({
      path: rutaRelativa,
      directory: Directory.Data,
      data: base64,
      recursive: true,
      // Sin encoding: Filesystem decodifica el base64 y escribe los bytes JPEG.
    });
    if (!uri) {
      throw new Error('El almacenamiento no devolvió la ruta de la foto guardada.');
    }
    return {
      uri,
      rutaRelativa,
      nombre,
      webUrl: Capacitor.convertFileSrc(uri),
      guardadoEnNavegador: false,
    };
  }

  private leerJpeg(dataUrl: string): { base64: string; bytes: Uint8Array<ArrayBuffer> } {
    const match = typeof dataUrl === 'string'
      ? /^data:image\/(?:jpeg|jpg);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl)
      : null;
    if (!match || match[1].length % 4 !== 0) {
      throw new Error('El editor debe exportar una imagen JPEG válida en base64.');
    }
    const base64 = match[1];
    let binary: string;
    try {
      binary = atob(base64);
    } catch {
      throw new Error('Los datos de la imagen JPEG no son base64 válido.');
    }
    if (btoa(binary) !== base64 || binary.length < 4
      || binary.charCodeAt(0) !== 0xff || binary.charCodeAt(1) !== 0xd8
      || binary.charCodeAt(binary.length - 2) !== 0xff
      || binary.charCodeAt(binary.length - 1) !== 0xd9) {
      throw new Error('Los datos exportados no corresponden a una imagen JPEG completa.');
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { base64, bytes };
  }

  private crearUuid(): string {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    // randomUUID requiere contexto seguro; getRandomValues también funciona en WebViews HTTP.
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private descargarJpeg(bytes: Uint8Array<ArrayBuffer>, nombre: string): void {
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const enlace = document.createElement('a');
    enlace.href = objectUrl;
    enlace.download = nombre;
    enlace.hidden = true;
    document.body.appendChild(enlace);
    try {
      enlace.click();
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    } finally {
      enlace.remove();
    }
    // Permite iniciar la descarga antes de liberar su URL temporal.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}
