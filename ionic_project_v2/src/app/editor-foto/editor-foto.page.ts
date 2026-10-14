import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import type { EditorApi } from 'photoeditorsdk/no-polyfills';
import { environment } from '../../environments/environment';
import { FotoEditorService, FotoGuardada, esCancelacionCamara } from '../services/foto-editor.service';
import { editorFotoLocale } from './editor-foto.locale';

type EstadoEditor = Awaited<ReturnType<EditorApi['serialize']>>;

@Component({
  selector: 'app-editor-foto',
  templateUrl: './editor-foto.page.html',
  styleUrls: ['./editor-foto.page.scss'],
  standalone: false,
})
export class EditorFotoPage implements OnDestroy {
  @ViewChild('editorContainer', { static: true }) private container!: ElementRef<HTMLDivElement>;
  readonly foto = signal<string | null>(null);
  readonly fotoGuardada = signal<FotoGuardada | null>(null);
  readonly capturando = signal(false);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly listo = signal(false);
  readonly error = signal('');
  readonly ocupado = computed(() => this.capturando() || this.cargando() || this.guardando());
  readonly esNativo = Capacitor.isNativePlatform();

  private editor: EditorApi | null = null;
  private estadoEditor: EstadoEditor | null = null;
  private visible = false;
  private destruido = false;
  private generacion = 0;
  private suspension: Promise<void> = Promise.resolve();
  private operacionGuardar: Promise<void> | null = null;
  private inicializacion: Promise<void> | null = null;

  constructor(
    private fotos: FotoEditorService,
    private toast: ToastController,
    private alerts: AlertController,
    private zone: NgZone,
    private changes: ChangeDetectorRef,
  ) {}

  async ionViewDidEnter(): Promise<void> {
    this.visible = true;
    await this.suspension;
    if (this.foto() && !this.editor && this.visible && !this.destruido) {
      await this.iniciarEditor();
    }
  }

  ionViewWillLeave(): void {
    this.visible = false;
    this.generacion++;
    this.cargando.set(false);
    this.listo.set(false);
    // Ionic conserva las páginas: guardar el estado antes de liberar WebGL.
    this.suspension = this.suspenderEditor();
  }

  async tomarFoto(): Promise<void> {
    if (this.ocupado() || !this.visible || this.destruido) return;
    this.capturando.set(true);
    try {
      if (this.editor?.hasChanges()) {
        const confirmacion = await this.alerts.create({
          header: 'Tomar otra foto',
          message: 'Los cambios sin guardar de la foto actual se descartarán al tomar otra foto.',
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Continuar', role: 'confirm' },
          ],
        });
        await confirmacion.present();
        if ((await confirmacion.onDidDismiss()).role !== 'confirm') return;
      }
      const generacion = this.generacion;
      const imagen = await this.fotos.capturarFoto();
      if (!this.visible || this.destruido || generacion !== this.generacion) return;
      this.editor?.dispose();
      this.editor = null;
      this.estadoEditor = null;
      this.listo.set(false);
      this.foto.set(imagen);
      this.fotoGuardada.set(null);
      this.error.set('');
      await this.iniciarEditor();
    } catch (error) {
      if (!esCancelacionCamara(error)) {
        this.error.set('No se pudo tomar la foto. Revisa el permiso de cámara e inténtalo de nuevo.');
        console.error('Error de cámara:', error);
      }
    } finally {
      this.capturando.set(false);
    }
  }

  async reintentarEditor(): Promise<void> {
    if (!this.ocupado() && this.foto()) await this.iniciarEditor();
  }

  async guardarFoto(): Promise<void> {
    if (!this.editor || !this.listo() || this.ocupado()) return;
    this.guardando.set(true);
    this.error.set('');
    this.operacionGuardar = this.exportarYGuardar(this.editor);
    try {
      await this.operacionGuardar;
    } finally {
      this.guardando.set(false);
      this.operacionGuardar = null;
    }
  }

  private async exportarYGuardar(editor: EditorApi): Promise<void> {
    try {
      const { ImageFormat, ExportFormat } = await import('photoeditorsdk/no-polyfills');
      const imagen = await this.zone.runOutsideAngular(() => editor.export({
        format: ImageFormat.JPEG,
        exportType: ExportFormat.DATA_URL,
        quality: 0.9,
        enableDownload: false,
        preventExportEvent: true,
      }));
      if (typeof imagen !== 'string') throw new Error('El editor no devolvió un JPEG en base64.');
      const guardada = await this.fotos.guardarFoto(imagen);
      this.fotoGuardada.set(guardada);
      if (this.visible && !this.destruido) {
        await this.mensaje(guardada.guardadoEnNavegador
          ? 'Descarga solicitada. Revisa las descargas de tu navegador.'
          : 'Foto editada guardada en el dispositivo.');
      }
    } catch (error) {
      this.error.set('No se pudo guardar la foto. Tus cambios siguen en el editor; vuelve a intentarlo.');
      console.error('Error al exportar o guardar la foto:', error);
    }
  }

  private async iniciarEditor(): Promise<void> {
    if (this.inicializacion) return this.inicializacion;
    const operacion = this.crearEditor();
    this.inicializacion = operacion;
    try {
      await operacion;
    } finally {
      this.inicializacion = null;
    }
  }

  private async crearEditor(): Promise<void> {
    await this.suspension;
    const imagen = this.foto();
    if (!imagen || !this.visible || this.destruido || this.editor) return;
    const generacion = ++this.generacion;
    this.cargando.set(true);
    this.error.set('');
    // El contenedor permanece en el DOM y se muestra antes de inicializar el SDK.
    this.changes.detectChanges();
    let nuevoEditor: EditorApi | null = null;
    try {
      const sdk = await import('photoeditorsdk/no-polyfills');
      if (!this.visible || this.destruido || generacion !== this.generacion) return;
      nuevoEditor = await this.zone.runOutsideAngular(() => sdk.PhotoEditorSDKUI.init({
        license: environment.photoEditorLicense,
        container: this.container.nativeElement,
        image: imagen,
        assetBaseUrl: new URL('assets/photoeditorsdk/', document.baseURI).href,
        layout: 'basic',
        theme: 'dark',
        language: 'es',
        custom: { languages: { es: editorFotoLocale } },
        tools: [
          sdk.Tool.TRANSFORM, sdk.Tool.FILTER, sdk.Tool.ADJUSTMENT, sdk.Tool.FOCUS,
          sdk.Tool.TEXT, sdk.Tool.TEXT_DESIGN, sdk.Tool.STICKER, sdk.Tool.BRUSH,
          sdk.Tool.FRAME, sdk.Tool.OVERLAY,
        ],
        mainCanvasActions: [sdk.CanvasAction.UNDO, sdk.CanvasAction.REDO],
        displaySerializationModal: false,
        export: { image: {
          format: sdk.ImageFormat.JPEG,
          exportType: sdk.ExportFormat.DATA_URL,
          quality: 0.9,
          enableDownload: false,
        } },
      }));
      if (!this.visible || this.destruido || generacion !== this.generacion) {
        nuevoEditor.dispose();
        return;
      }
      if (this.estadoEditor) await nuevoEditor.deserialize(this.estadoEditor);
      if (!this.visible || this.destruido || generacion !== this.generacion) {
        nuevoEditor.dispose();
        return;
      }
      this.editor = nuevoEditor;
      this.listo.set(true);
    } catch (error) {
      nuevoEditor?.dispose();
      if (generacion === this.generacion && !this.destruido) {
        this.error.set('No se pudo abrir el editor. Vuelve a intentarlo.');
        console.error('Error al inicializar PhotoEditor SDK:', error);
      }
    } finally {
      if (generacion === this.generacion) this.cargando.set(false);
    }
  }

  private async suspenderEditor(): Promise<void> {
    await this.inicializacion;
    // No liberar el editor mientras se está exportando la imagen.
    await this.operacionGuardar;
    const editor = this.editor;
    this.editor = null;
    if (!editor) return;
    try {
      this.estadoEditor = await editor.serialize({ image: false });
    } catch (error) {
      this.estadoEditor = null;
      this.error.set('No se pudieron conservar los cambios al salir. La foto original sigue disponible.');
      console.error('Error al conservar la edición:', error);
    } finally {
      editor.dispose();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.visible = false;
    this.generacion++;
    // La exportación o suspensión en curso libera su instancia al terminar.
    if (!this.operacionGuardar) {
      this.editor?.dispose();
      this.editor = null;
    } else {
      void this.suspenderEditor();
    }
  }

  private async mensaje(message: string): Promise<void> {
    const aviso = await this.toast.create({ message, duration: 3500, position: 'top' });
    await aviso.present();
  }
}
