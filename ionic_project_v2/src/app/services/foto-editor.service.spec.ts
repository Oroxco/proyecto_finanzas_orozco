import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { esCancelacionCamara, FotoEditorService } from './foto-editor.service';

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraSource: { Camera: 'CAMERA' },
  CameraResultType: { DataUrl: 'dataUrl' },
  CameraDirection: { Rear: 'REAR' },
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(), convertFileSrc: vi.fn() },
}));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA' },
  Filesystem: { writeFile: vi.fn() },
}));

// JPEG real de un píxel rojo, no texto codificado presentado como imagen.
const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD50ooor8MP9Uz/2Q==';
const JPEG_DATA_URL = `data:image/jpeg;base64,${JPEG_BASE64}`;
const UUID = '12345678-1234-4234-8234-123456789abc';
const NOMBRE = `foto-2026-10-12T18-00-00-000Z_${UUID}.jpg`;
const URI = `file:///data/user/0/example/files/fotos-editadas/${NOMBRE}`;

describe('FotoEditorService', () => {
  let service: FotoEditorService;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T18:00:00.000Z'));
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(UUID);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: URI });
    vi.mocked(Capacitor.convertFileSrc).mockReturnValue('http://localhost/_capacitor_file_/foto.jpg');
    service = new FotoEditorService();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('captura una foto sin abrir un editor adicional ni guardar el original en galería', async () => {
    vi.mocked(Camera.getPhoto).mockResolvedValue({ dataUrl: JPEG_DATA_URL, format: 'jpeg', saved: false });
    await expect(service.capturarFoto()).resolves.toBe(JPEG_DATA_URL);
    expect(Camera.getPhoto).toHaveBeenCalledWith({
      source: CameraSource.Camera, resultType: CameraResultType.DataUrl,
      direction: CameraDirection.Rear, quality: 90, allowEditing: false,
      saveToGallery: false, webUseInput: true, width: 2048, height: 2048,
    });
  });

  it('informa una respuesta vacía de la cámara y conserva sus errores de permisos', async () => {
    vi.mocked(Camera.getPhoto).mockResolvedValue({ format: 'jpeg', saved: false });
    await expect(service.capturarFoto()).rejects.toThrow('La cámara no devolvió una imagen');
    const error = { code: 'OS-PLUG-CAMR-0003', message: 'Camera permission denied' };
    vi.mocked(Camera.getPhoto).mockRejectedValue(error);
    await expect(service.capturarFoto()).rejects.toBe(error);
  });

  it('escribe los bytes JPEG en Data y devuelve la URI real del plugin', async () => {
    const result = await service.guardarFoto(JPEG_DATA_URL);
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: `fotos-editadas/${NOMBRE}`, directory: Directory.Data,
      data: JPEG_BASE64, recursive: true,
    });
    const options = vi.mocked(Filesystem.writeFile).mock.calls[0][0];
    expect(options).not.toHaveProperty('encoding');
    expect(options.data).not.toContain('data:image');
    expect(atob(options.data as string).slice(0, 2)).toBe('\xff\xd8');
    expect(atob(options.data as string).slice(-2)).toBe('\xff\xd9');
    expect(result).toEqual({
      uri: URI, rutaRelativa: `fotos-editadas/${NOMBRE}`, nombre: NOMBRE,
      webUrl: 'http://localhost/_capacitor_file_/foto.jpg', guardadoEnNavegador: false,
    });
    expect(Capacitor.convertFileSrc).toHaveBeenCalledWith(URI);
  });

  it('genera rutas distintas aunque dos fotos se guarden en el mismo milisegundo', async () => {
    vi.mocked(globalThis.crypto.randomUUID)
      .mockReturnValueOnce(UUID)
      .mockReturnValueOnce('22345678-1234-4234-8234-123456789abc');
    const first = await service.guardarFoto(JPEG_DATA_URL);
    const second = await service.guardarFoto(JPEG_DATA_URL);
    expect(second.rutaRelativa).not.toBe(first.rutaRelativa);
  });

  it('genera un UUID con aleatoriedad segura cuando el WebView no ofrece randomUUID', async () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xab);
      return bytes;
    });
    vi.stubGlobal('crypto', { getRandomValues });
    const result = await service.guardarFoto(JPEG_DATA_URL);
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(result.nombre).toContain('_abababab-abab-4bab-abab-abababababab.jpg');
  });

  it.each([
    '', 'file:///tmp/foto.jpg', 'data:image/png;base64,iVBORw0KGgo=',
    'data:image/jpeg;base64,!!!!', 'data:image/jpeg;base64,YQ=',
    'data:image/jpeg;base64,aG9sYQ==',
    `data:image/jpeg;base64,${JPEG_BASE64.slice(0, -8)}`,
  ])('rechaza exportaciones inválidas antes de escribir: %s', async invalid => {
    await expect(service.guardarFoto(invalid)).rejects.toThrow();
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
  });

  it('propaga el fallo de almacenamiento sin anunciar un guardado exitoso', async () => {
    const error = new Error('No queda espacio disponible');
    vi.mocked(Filesystem.writeFile).mockRejectedValue(error);
    await expect(service.guardarFoto(JPEG_DATA_URL)).rejects.toBe(error);
    expect(Capacitor.convertFileSrc).not.toHaveBeenCalled();
  });

  it('rechaza un resultado de almacenamiento sin URI', async () => {
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: '' });
    await expect(service.guardarFoto(JPEG_DATA_URL)).rejects.toThrow('no devolvió la ruta');
  });

  it('solicita una descarga de bytes JPEG en web sin inventar una ruta local', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    const createObjectURL = vi.fn().mockReturnValue('blob:foto-editada');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const result = await service.guardarFoto(JPEG_DATA_URL);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBe(atob(JPEG_BASE64).length);
    expect(click).toHaveBeenCalledOnce();
    const enlace = click.mock.contexts[0] as HTMLAnchorElement;
    expect(enlace.download).toBe(NOMBRE);
    expect(enlace.href).toBe('blob:foto-editada');
    expect(document.body.contains(enlace)).toBe(false);
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
    expect(result).toEqual({ uri: null, rutaRelativa: '', nombre: NOMBRE,
      webUrl: JPEG_DATA_URL, guardadoEnNavegador: true });
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:foto-editada');
  });
});

describe('esCancelacionCamara', () => {
  it.each(['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0013', 'OS-PLUG-CAMR-0017', 'OS-PLUG-CAMR-0020'])
    ('reconoce la cancelación oficial %s', code => {
      expect(esCancelacionCamara({ code, message: '' })).toBe(true);
    });
  it.each(['User cancelled photos app', 'User canceled photos app', 'Proceso cancelado', 'Captura cancelada'])
    ('reconoce mensajes de cancelación: %s', message => {
      expect(esCancelacionCamara(new Error(message))).toBe(true);
      expect(esCancelacionCamara(message)).toBe(true);
    });
  it.each([null, undefined, 'Permission denied', new Error('Camera unavailable'),
    { code: 'OS-PLUG-CAMR-0003', message: 'Permissions canceled' },
    { code: 'OS-PLUG-CAMR-0010', message: 'Could not take photo' }])
    ('no trata un fallo real como cancelación: %s', error => {
      expect(esCancelacionCamara(error)).toBe(false);
    });
});
