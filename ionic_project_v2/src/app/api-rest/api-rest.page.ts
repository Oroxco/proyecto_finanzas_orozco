import { Component, OnDestroy, computed, signal } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable, Subscription, finalize } from 'rxjs';
import { ApiRestService, ErrorApiRest, NotaRest, NotaRestEntrada, ResultadoRest, normalizarErrorRest } from '../services/api-rest.service';

type MetodoRest = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface ActividadRest {
  numero: number;
  fecha: Date;
  metodo: MetodoRest;
  recurso: string;
  status: number;
  exito: boolean;
}

@Component({
  selector: 'app-api-rest',
  templateUrl: './api-rest.page.html',
  styleUrls: ['./api-rest.page.scss'],
  standalone: false,
})
export class ApiRestPage implements OnDestroy {
  readonly notas = signal<NotaRest[]>([]);
  readonly seleccionada = signal<NotaRest | null>(null);
  readonly titulo = signal('');
  readonly descripcion = signal('');
  readonly idBusqueda = signal('');
  readonly urlApi = signal('');
  readonly operacion = signal<string | null>(null);
  readonly confirmando = signal(false);
  readonly ocupado = computed(() => this.operacion() !== null || this.confirmando());
  readonly error = signal<ErrorApiRest | null>(null);
  readonly exito = signal('');
  readonly respuesta = signal<unknown>(null);
  readonly actividades = signal<ActividadRest[]>([]);

  private solicitud: Subscription | null = null;
  private destruida = false;
  private visible = true;
  private versionVista = 0;
  private contador = 0;

  constructor(private readonly api: ApiRestService, private readonly alerts: AlertController) {
    this.urlApi.set(api.baseUrl);
  }

  ionViewDidEnter(): void {
    this.visible = true;
    this.versionVista++;
    this.listar();
  }

  ionViewWillLeave(): void {
    this.visible = false;
    this.versionVista++;
    this.solicitud?.unsubscribe();
    this.solicitud = null;
    this.confirmando.set(false);
  }

  ngOnDestroy(): void {
    this.destruida = true;
    this.ionViewWillLeave();
  }

  conectar(): void {
    if (this.ocupado() || this.destruida) return;
    try {
      this.urlApi.set(this.api.configurarUrl(this.urlApi()));
      this.notas.set([]);
      this.nuevaNota();
      this.listar();
    } catch (error: unknown) {
      this.mostrarError(error);
    }
  }

  listar(): void {
    this.ejecutar('GET', this.recurso(), () => this.api.listar(), result => {
      this.notas.set(result.data);
      const actual = this.seleccionada();
      if (actual && !result.data.some(nota => nota.id === actual.id)) this.limpiarFormulario();
    });
  }

  consultarId(): void {
    if (this.ocupado() || this.destruida) return;
    const id = Number(this.idBusqueda());
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.mostrarError(new ErrorApiRest(0, 'ID_INVALIDO', 'Escribe un ID entero mayor que cero.'));
      return;
    }
    this.consultar(id);
  }

  consultar(id: number): void {
    this.ejecutar('GET', this.recurso(id), () => this.api.obtener(id), result => this.cargarFormulario(result.data));
  }

  nuevaNota(): void {
    if (this.ocupado()) return;
    this.limpiarFormulario();
    this.error.set(null);
    this.exito.set('');
    this.respuesta.set(null);
  }

  crear(): void {
    if (this.ocupado()) return;
    const entrada = this.validarFormulario();
    if (!entrada) return;
    this.ejecutar('POST', this.recurso(), () => this.api.crear(entrada), result => this.actualizarNota(result.data));
  }

  reemplazar(): void {
    if (this.ocupado()) return;
    const actual = this.seleccionada();
    if (!actual) return;
    const entrada = this.validarFormulario();
    if (!entrada) return;
    this.ejecutar('PUT', this.recurso(actual.id), () => this.api.reemplazar(actual.id, entrada), result => this.actualizarNota(result.data));
  }

  actualizarTitulo(): void {
    if (this.ocupado()) return;
    const actual = this.seleccionada();
    if (!actual) return;
    const titulo = this.titulo().trim();
    if (!titulo || titulo.length > 120) {
      this.mostrarError(new ErrorApiRest(0, 'VALIDACION_LOCAL', 'El título es obligatorio y admite hasta 120 caracteres.'));
      return;
    }
    this.ejecutar('PATCH', this.recurso(actual.id), () => this.api.actualizarTitulo(actual.id, titulo), result => this.actualizarNota(result.data));
  }

  async eliminarSeleccionada(): Promise<void> {
    if (this.ocupado() || this.destruida) return;
    const actual = this.seleccionada();
    if (!actual) return;
    const version = this.versionVista;
    let confirmado = false;
    this.confirmando.set(true);
    try {
      const alert = await this.alerts.create({
        header: 'Eliminar nota',
        message: `¿Eliminar la nota #${actual.id}? Esta acción no se puede deshacer.`,
        buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'confirm' }],
      });
      if (this.destruida || !this.visible || version !== this.versionVista) return;
      await alert.present();
      const result = await alert.onDidDismiss();
      confirmado = result.role === 'confirm';
    } catch (error: unknown) {
      if (!this.destruida && this.visible) this.mostrarError(error);
    } finally {
      if (version === this.versionVista) this.confirmando.set(false);
    }
    if (!confirmado || this.destruida || !this.visible || version !== this.versionVista) return;
    this.ejecutar('DELETE', this.recurso(actual.id), () => this.api.eliminar(actual.id), () => {
      this.notas.update(notas => notas.filter(nota => nota.id !== actual.id));
      this.limpiarFormulario();
    });
  }

  private validarFormulario(): NotaRestEntrada | null {
    const titulo = this.titulo().trim();
    const descripcion = this.descripcion().trim();
    if (!titulo || titulo.length > 120 || descripcion.length > 2000) {
      this.mostrarError(new ErrorApiRest(0, 'VALIDACION_LOCAL', 'Escribe un título de hasta 120 caracteres y una descripción de hasta 2000.'));
      return null;
    }
    return { titulo, descripcion };
  }

  private cargarFormulario(nota: NotaRest): void {
    this.seleccionada.set(nota);
    this.titulo.set(nota.titulo);
    this.descripcion.set(nota.descripcion);
    this.idBusqueda.set(String(nota.id));
  }

  private limpiarFormulario(): void {
    this.seleccionada.set(null);
    this.titulo.set('');
    this.descripcion.set('');
    this.idBusqueda.set('');
  }

  private actualizarNota(nota: NotaRest): void {
    this.notas.update(notas => [nota, ...notas.filter(actual => actual.id !== nota.id)].sort((a, b) => b.id - a.id));
    this.cargarFormulario(nota);
  }

  private mostrarError(error: unknown): void {
    this.error.set(normalizarErrorRest(error));
    this.exito.set('');
    this.respuesta.set(null);
  }

  private recurso(id?: number): string {
    // Muestra la ruta y parámetros realmente enviados, sin incluir credenciales.
    return `${new URL(this.api.baseUrl).pathname}?recurso=notas${id === undefined ? '' : `&id=${id}`}`;
  }

  private registrar(metodo: MetodoRest, recurso: string, status: number, exito: boolean): void {
    // Guarda únicamente método, ruta, fecha y estado; no guarda cuerpos ni credenciales.
    this.actividades.update(actividades => [{ numero: ++this.contador, fecha: new Date(), metodo, recurso, status, exito }, ...actividades].slice(0, 8));
  }

  private ejecutar<T>(metodo: MetodoRest, recurso: string, solicitud: () => Observable<ResultadoRest<T>>, aplicar: (resultado: ResultadoRest<T>) => void): void {
    if (this.ocupado() || this.destruida || !this.visible) return;
    this.error.set(null);
    this.exito.set('');
    this.respuesta.set(null);
    this.operacion.set(`${metodo} ${recurso}`);
    try {
      this.solicitud = solicitud().pipe(finalize(() => this.operacion.set(null))).subscribe({
        next: result => {
          aplicar(result);
          this.registrar(metodo, recurso, result.status, true);
          this.exito.set(`${metodo} · HTTP ${result.status} · ${result.mensaje}`);
          this.respuesta.set(result.data);
        },
        error: (error: unknown) => {
          const normalizado = normalizarErrorRest(error);
          this.registrar(metodo, recurso, normalizado.status, false);
          this.mostrarError(normalizado);
        },
      });
    } catch (error: unknown) {
      this.operacion.set(null);
      this.mostrarError(error);
    }
  }
}
