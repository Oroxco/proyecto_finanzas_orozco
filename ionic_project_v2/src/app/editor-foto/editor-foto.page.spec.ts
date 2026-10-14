// These tests exercise the async page lifecycle without rendering SDK/WebGL UI.
import '@angular/compiler';
import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FotoEditorService, FotoGuardada } from '../services/foto-editor.service';
import { EditorFotoPage } from './editor-foto.page';

const sdk = vi.hoisted(() => ({ init: vi.fn() }));
// AOT retains template dependencies even though these tests instantiate the
// page directly. Stub those exports too; Ionic 7's package uses directory ESM
// imports that cannot be loaded by the Node-based Angular test runner.
vi.mock('@ionic/angular', () => ({
  AlertController: class {},
  ToastController: class {},
  IonHeader: class {},
  IonToolbar: class {},
  IonTitle: class {},
  IonButtons: class {},
  IonButton: class {},
  IonIcon: class {},
  IonContent: class {},
  IonNote: class {},
  IonSpinner: class {},
}));
vi.mock('photoeditorsdk/no-polyfills', () => ({
  PhotoEditorSDKUI: { init: sdk.init },
  Tool: { TRANSFORM: 'transform', FILTER: 'filter', ADJUSTMENT: 'adjustment',
    FOCUS: 'focus', TEXT: 'text', TEXT_DESIGN: 'textdesign', STICKER: 'sticker',
    BRUSH: 'brush', FRAME: 'frame', OVERLAY: 'overlay' },
  CanvasAction: { UNDO: 'undo', REDO: 'redo' },
  ImageFormat: { JPEG: 'image/jpeg' },
  ExportFormat: { DATA_URL: 'data-url' },
}));

const FOTO = 'data:image/jpeg;base64,/9j/2Q==';
const OTRA_FOTO = 'data:image/jpeg;base64,/9j/AAAB/9k=';
const GUARDADA: FotoGuardada = {
  uri: 'file:///data/user/0/example/files/fotos-editadas/foto.jpg',
  rutaRelativa: 'fotos-editadas/foto.jpg', nombre: 'foto.jpg',
  webUrl: 'http://localhost/_capacitor_file_/foto.jpg', guardadoEnNavegador: false,
};

function diferida<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function crearEditor() {
  return {
    hasChanges: vi.fn().mockReturnValue(false),
    export: vi.fn().mockResolvedValue(FOTO),
    serialize: vi.fn().mockResolvedValue({ version: '5.19.7', operations: [] }),
    deserialize: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
  };
}

describe('EditorFotoPage: captura, guardado y ciclo de vida Ionic', () => {
  let page: EditorFotoPage;
  let fotos: { capturarFoto: ReturnType<typeof vi.fn>; guardarFoto: ReturnType<typeof vi.fn> };
  let aviso: { present: ReturnType<typeof vi.fn> };
  let toast: { create: ReturnType<typeof vi.fn> };
  let alert: { present: ReturnType<typeof vi.fn>; onDidDismiss: ReturnType<typeof vi.fn> };
  let alerts: { create: ReturnType<typeof vi.fn> };
  let editor: ReturnType<typeof crearEditor>;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fotos = { capturarFoto: vi.fn().mockResolvedValue(FOTO), guardarFoto: vi.fn().mockResolvedValue(GUARDADA) };
    aviso = { present: vi.fn().mockResolvedValue(undefined) };
    toast = { create: vi.fn().mockResolvedValue(aviso) };
    alert = { present: vi.fn().mockResolvedValue(undefined), onDidDismiss: vi.fn().mockResolvedValue({ role: 'confirm' }) };
    alerts = { create: vi.fn().mockResolvedValue(alert) };
    editor = crearEditor();
    sdk.init.mockResolvedValue(editor);
    page = new EditorFotoPage(
      fotos as unknown as FotoEditorService,
      toast as unknown as ToastController,
      alerts as unknown as AlertController,
      { runOutsideAngular: <T>(operation: () => T) => operation() } as NgZone,
      { detectChanges: vi.fn() } as unknown as ChangeDetectorRef,
    );
    Object.assign(page, { container: new ElementRef(document.createElement('div')) });
    await page.ionViewDidEnter();
  });

  afterEach(() => {
    page.ngOnDestroy();
    vi.restoreAllMocks();
  });

  it('conserva la foto y su editor cuando el usuario cancela la cámara', async () => {
    await page.tomarFoto();
    fotos.capturarFoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0006', message: 'User cancelled photos app' });
    await page.tomarFoto();
    expect(page.foto()).toBe(FOTO);
    expect(page.listo()).toBe(true);
    expect(page.error()).toBe('');
    expect(page.capturando()).toBe(false);
    expect(editor.dispose).not.toHaveBeenCalled();
    expect(sdk.init).toHaveBeenCalledOnce();
  });

  it('muestra el fallo de permisos sin perder la edición anterior', async () => {
    await page.tomarFoto();
    fotos.capturarFoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0003', message: 'Permission denied' });
    await page.tomarFoto();
    expect(page.error()).toContain('permiso de cámara');
    expect(page.foto()).toBe(FOTO);
    expect(page.listo()).toBe(true);
    expect(editor.dispose).not.toHaveBeenCalled();
    expect(page.ocupado()).toBe(false);
  });

  it('conserva cambios cuando se cancela la confirmación de tomar otra foto', async () => {
    await page.tomarFoto();
    editor.hasChanges.mockReturnValue(true);
    alert.onDidDismiss.mockResolvedValue({ role: 'cancel' });
    await page.tomarFoto();
    expect(alert.present).toHaveBeenCalledOnce();
    expect(fotos.capturarFoto).toHaveBeenCalledOnce();
    expect(editor.dispose).not.toHaveBeenCalled();
    expect(page.capturando()).toBe(false);
  });

  it('reemplaza la foto únicamente cuando la nueva captura terminó', async () => {
    await page.tomarFoto();
    const captura = diferida<string>();
    const nuevoEditor = crearEditor();
    fotos.capturarFoto.mockReturnValue(captura.promise);
    sdk.init.mockResolvedValue(nuevoEditor);
    page.fotoGuardada.set(GUARDADA);
    const tomando = page.tomarFoto();
    expect(page.foto()).toBe(FOTO);
    expect(editor.dispose).not.toHaveBeenCalled();
    captura.resolve(OTRA_FOTO);
    await tomando;
    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(page.foto()).toBe(OTRA_FOTO);
    expect(page.fotoGuardada()).toBeNull();
    expect(page.listo()).toBe(true);
    expect(sdk.init.mock.calls[1][0].image).toBe(OTRA_FOTO);
  });

  it('ignora una foto que la cámara devuelve después de abandonar la pantalla', async () => {
    const captura = diferida<string>();
    fotos.capturarFoto.mockReturnValue(captura.promise);
    const tomando = page.tomarFoto();
    page.ionViewWillLeave();
    captura.resolve(FOTO);
    await tomando;
    expect(page.foto()).toBeNull();
    expect(sdk.init).not.toHaveBeenCalled();
    expect(page.capturando()).toBe(false);
  });

  it('libera una instancia SDK que termina de inicializarse después de salir', async () => {
    const inicio = diferida<ReturnType<typeof crearEditor>>();
    sdk.init.mockReturnValue(inicio.promise);
    const tomando = page.tomarFoto();
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
    page.ionViewWillLeave();
    inicio.resolve(editor);
    await tomando;
    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(page.listo()).toBe(false);
    expect(page.cargando()).toBe(false);
  });

  it('inicializa una sola instancia ante dos entradas simultáneas', async () => {
    const inicio = diferida<ReturnType<typeof crearEditor>>();
    sdk.init.mockReturnValue(inicio.promise);
    page.foto.set(FOTO);
    const primeraEntrada = page.ionViewDidEnter();
    const segundaEntrada = page.ionViewDidEnter();
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
    inicio.resolve(editor);
    await Promise.all([primeraEntrada, segundaEntrada]);
    expect(sdk.init).toHaveBeenCalledOnce();
    expect(page.listo()).toBe(true);
  });

  it('vuelve a abrir el editor al reentrar durante una inicialización anterior', async () => {
    const inicio = diferida<ReturnType<typeof crearEditor>>();
    const nuevoEditor = crearEditor();
    sdk.init.mockReturnValueOnce(inicio.promise).mockResolvedValueOnce(nuevoEditor);
    const tomando = page.tomarFoto();
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
    page.ionViewWillLeave();
    const regresando = page.ionViewDidEnter();
    inicio.resolve(editor);
    await Promise.all([tomando, regresando]);
    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(sdk.init).toHaveBeenCalledTimes(2);
    expect(nuevoEditor.dispose).not.toHaveBeenCalled();
    expect(page.listo()).toBe(true);
    expect(page.cargando()).toBe(false);
  });

  it('permite reintentar la inicialización SDK sin volver a tomar la foto', async () => {
    sdk.init.mockRejectedValueOnce(new Error('No pudo cargar un recurso'));
    await page.tomarFoto();
    expect(page.foto()).toBe(FOTO);
    expect(page.listo()).toBe(false);
    expect(page.cargando()).toBe(false);
    expect(page.error()).toContain('No se pudo abrir el editor');
    await page.reintentarEditor();
    expect(fotos.capturarFoto).toHaveBeenCalledOnce();
    expect(sdk.init).toHaveBeenCalledTimes(2);
    expect(page.error()).toBe('');
    expect(page.listo()).toBe(true);
  });

  it('restaura la edición al volver a una página conservada en la caché de Ionic', async () => {
    await page.tomarFoto();
    const estado = { version: '5.19.7', operations: [{ type: 'filter', identifier: 'summer' }] };
    editor.serialize.mockResolvedValue(estado);
    const restaurado = crearEditor();
    sdk.init.mockResolvedValue(restaurado);
    page.ionViewWillLeave();
    await page.ionViewDidEnter();
    expect(editor.serialize).toHaveBeenCalledWith({ image: false });
    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(restaurado.deserialize).toHaveBeenCalledWith(estado);
    expect(page.foto()).toBe(FOTO);
    expect(page.listo()).toBe(true);
  });

  it('exporta la imagen editada y anuncia éxito después de recibir la ruta local', async () => {
    await page.tomarFoto();
    const escritura = diferida<FotoGuardada>();
    fotos.guardarFoto.mockReturnValue(escritura.promise);
    const guardando = page.guardarFoto();
    await vi.waitFor(() => expect(fotos.guardarFoto).toHaveBeenCalledWith(FOTO));
    expect(page.fotoGuardada()).toBeNull();
    expect(toast.create).not.toHaveBeenCalled();
    expect(page.guardando()).toBe(true);
    escritura.resolve(GUARDADA);
    await guardando;
    expect(editor.export).toHaveBeenCalledWith(expect.objectContaining({
      format: 'image/jpeg', exportType: 'data-url', enableDownload: false, preventExportEvent: true,
    }));
    expect(page.fotoGuardada()).toEqual(GUARDADA);
    expect(aviso.present).toHaveBeenCalledOnce();
    expect(page.guardando()).toBe(false);
  });

  it('permite reintentar un fallo de exportación sin destruir los cambios', async () => {
    await page.tomarFoto();
    editor.export.mockRejectedValueOnce(new Error('Falló WebGL'));
    await page.guardarFoto();
    expect(fotos.guardarFoto).not.toHaveBeenCalled();
    expect(toast.create).not.toHaveBeenCalled();
    expect(page.error()).toContain('Tus cambios siguen en el editor');
    expect(editor.dispose).not.toHaveBeenCalled();
    expect(page.listo()).toBe(true);
    expect(page.guardando()).toBe(false);
    await page.guardarFoto();
    expect(page.fotoGuardada()).toEqual(GUARDADA);
    expect(page.error()).toBe('');
  });

  it('conserva la edición y no anuncia éxito cuando falla el almacenamiento', async () => {
    await page.tomarFoto();
    fotos.guardarFoto.mockRejectedValue(new Error('Sin espacio en disco'));
    await page.guardarFoto();
    expect(page.fotoGuardada()).toBeNull();
    expect(page.error()).toContain('No se pudo guardar');
    expect(page.guardando()).toBe(false);
    expect(page.listo()).toBe(true);
    expect(toast.create).not.toHaveBeenCalled();
    expect(editor.dispose).not.toHaveBeenCalled();
  });

  it('espera la exportación pendiente antes de liberar WebGL al cambiar de pestaña', async () => {
    await page.tomarFoto();
    const exportacion = diferida<string>();
    editor.export.mockReturnValue(exportacion.promise);
    const guardando = page.guardarFoto();
    await vi.waitFor(() => expect(editor.export).toHaveBeenCalledOnce());
    page.ionViewWillLeave();
    expect(editor.dispose).not.toHaveBeenCalled();
    exportacion.resolve(FOTO);
    await guardando;
    await vi.waitFor(() => expect(editor.dispose).toHaveBeenCalledOnce());
    expect(fotos.guardarFoto).toHaveBeenCalledWith(FOTO);
    expect(page.fotoGuardada()).toEqual(GUARDADA);
    expect(toast.create).not.toHaveBeenCalled();
  });
});
