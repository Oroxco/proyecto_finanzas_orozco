import '@angular/compiler';
import { AlertController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRestPage } from './api-rest.page';
import { ApiRestService, NotaRest, ResultadoRest } from '../services/api-rest.service';

vi.mock('@ionic/angular', () => ({
  AlertController: class {}, IonHeader: class {}, IonToolbar: class {}, IonTitle: class {},
  IonButtons: class {}, IonBackButton: class {}, IonContent: class {}, IonInput: class {},
  IonTextarea: class {}, IonButton: class {}, IonSpinner: class {},
  NumericValueAccessor: class {}, TextValueAccessor: class {},
  IonMinValidator: class {}, IonMaxValidator: class {},
}));

const NOTA: NotaRest = {
  id: 7, titulo: 'Título original', descripcion: 'Descripción original',
  creado_en: '2026-10-14T12:00:00.000Z', actualizado_en: '2026-10-14T12:00:00.000Z',
};
function respuesta<T>(data: T, status = 200): ResultadoRest<T> { return { data, status, mensaje: 'Confirmado por el servidor.' }; }

describe('ApiRestPage: carga, cambios confirmados y errores', () => {
  let page: ApiRestPage;
  let api: {
    baseUrl: string;
    configurarUrl: ReturnType<typeof vi.fn>;
    listar: ReturnType<typeof vi.fn>;
    obtener: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    reemplazar: ReturnType<typeof vi.fn>;
    actualizarTitulo: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };
  let dialog: { present: ReturnType<typeof vi.fn>; onDidDismiss: ReturnType<typeof vi.fn> };
  let alerts: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      baseUrl: 'http://localhost:8080/api_ionic/demo_rest.php',
      configurarUrl: vi.fn().mockImplementation(url => url),
      listar: vi.fn().mockReturnValue(of(respuesta([NOTA]))),
      obtener: vi.fn().mockReturnValue(of(respuesta(NOTA))),
      crear: vi.fn().mockReturnValue(of(respuesta(NOTA, 201))),
      reemplazar: vi.fn().mockReturnValue(of(respuesta(NOTA))),
      actualizarTitulo: vi.fn().mockReturnValue(of(respuesta(NOTA))),
      eliminar: vi.fn().mockReturnValue(of(respuesta({ id: NOTA.id }))),
    };
    dialog = { present: vi.fn().mockResolvedValue(undefined), onDidDismiss: vi.fn().mockResolvedValue({ role: 'confirm' }) };
    alerts = { create: vi.fn().mockResolvedValue(dialog) };
    page = new ApiRestPage(api as unknown as ApiRestService, alerts as unknown as AlertController);
  });
  afterEach(() => page.ngOnDestroy());

  it('consulta notas al entrar y muestra el estado HTTP recibido', () => {
    page.ionViewDidEnter();
    expect(api.listar).toHaveBeenCalledOnce();
    expect(page.notas()).toEqual([NOTA]);
    expect(page.exito()).toContain('GET · HTTP 200');
    expect(page.actividades()[0].recurso).toBe('/api_ionic/demo_rest.php?recurso=notas');
    expect(page.ocupado()).toBe(false);
  });

  it('mantiene visible loading y evita peticiones concurrentes', () => {
    const pendiente = new Subject<ResultadoRest<NotaRest[]>>();
    api.listar.mockReturnValue(pendiente);
    page.listar();
    page.titulo.set('Otra nota');
    expect(page.ocupado()).toBe(true);
    page.listar();
    page.crear();
    expect(api.listar).toHaveBeenCalledOnce();
    expect(api.crear).not.toHaveBeenCalled();
    pendiente.next(respuesta([NOTA]));
    pendiente.complete();
    expect(page.ocupado()).toBe(false);
    expect(page.notas()).toEqual([NOTA]);
  });

  it('POST no añade la nota hasta recibir confirmación del servidor', () => {
    const pendiente = new Subject<ResultadoRest<NotaRest>>();
    api.crear.mockReturnValue(pendiente);
    page.titulo.set('  Nueva nota  ');
    page.descripcion.set('  Descripción  ');
    page.crear();
    expect(api.crear).toHaveBeenCalledWith({ titulo: 'Nueva nota', descripcion: 'Descripción' });
    expect(page.notas()).toEqual([]);
    pendiente.next(respuesta(NOTA, 201));
    pendiente.complete();
    expect(page.seleccionada()).toEqual(NOTA);
    expect(page.exito()).toContain('POST · HTTP 201');
    expect(page.ocupado()).toBe(false);
  });

  it('un fallo POST limpia loading y mantiene los datos para reintentar', () => {
    api.crear.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503, error: { error: { codigo: 'DB_NO_DISPONIBLE', mensaje: 'MySQL no está disponible.' } } })));
    page.titulo.set('Nota pendiente');
    page.descripcion.set('Conservar formulario');
    page.crear();
    expect(page.ocupado()).toBe(false);
    expect(page.exito()).toBe('');
    expect(page.error()?.status).toBe(503);
    expect(page.notas()).toEqual([]);
    expect(page.titulo()).toBe('Nota pendiente');
    expect(page.descripcion()).toBe('Conservar formulario');
    expect(page.actividades()[0].exito).toBe(false);
  });

  it('GET por ID carga el formulario, PUT manda dos campos y PATCH sólo título', () => {
    page.idBusqueda.set('7');
    page.consultarId();
    expect(api.obtener).toHaveBeenCalledWith(7);
    expect(page.actividades()[0].recurso).toBe('/api_ionic/demo_rest.php?recurso=notas&id=7');
    page.titulo.set('Título PUT');
    page.descripcion.set('Descripción PUT');
    page.reemplazar();
    expect(api.reemplazar).toHaveBeenCalledWith(7, { titulo: 'Título PUT', descripcion: 'Descripción PUT' });
    page.titulo.set('Título PATCH');
    page.descripcion.set('Esto no se enviará');
    page.actualizarTitulo();
    expect(api.actualizarTitulo).toHaveBeenCalledWith(7, 'Título PATCH');
    expect(page.descripcion()).toBe('Descripción original');
  });

  it('un GET 404 muestra error del servidor y elimina un éxito anterior', () => {
    page.listar();
    api.obtener.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { error: { codigo: 'NOTA_NO_EXISTE', mensaje: 'La nota no existe.' } } })));
    page.idBusqueda.set('9999');
    page.consultarId();
    expect(page.error()?.status).toBe(404);
    expect(page.error()?.message).toBe('La nota no existe.');
    expect(page.exito()).toBe('');
    expect(page.ocupado()).toBe(false);
    expect(page.notas()).toEqual([NOTA]);
  });

  it('DELETE necesita confirmación; cancelar conserva la nota', async () => {
    page.listar();
    page.consultar(7);
    dialog.onDidDismiss.mockResolvedValue({ role: 'cancel' });
    await page.eliminarSeleccionada();
    expect(api.eliminar).not.toHaveBeenCalled();
    expect(page.notas()).toEqual([NOTA]);
    expect(page.ocupado()).toBe(false);
    dialog.onDidDismiss.mockResolvedValue({ role: 'confirm' });
    await page.eliminarSeleccionada();
    expect(api.eliminar).toHaveBeenCalledWith(7);
    expect(page.notas()).toEqual([]);
    expect(page.seleccionada()).toBeNull();
    expect(page.exito()).toContain('DELETE · HTTP 200');
  });

  it('al destruirse cancela la petición y limpia loading sin aplicar respuestas tardías', () => {
    const pendiente = new Subject<ResultadoRest<NotaRest[]>>();
    api.listar.mockReturnValue(pendiente);
    page.listar();
    expect(page.ocupado()).toBe(true);
    page.ngOnDestroy();
    expect(page.ocupado()).toBe(false);
    pendiente.next(respuesta([NOTA]));
    expect(page.notas()).toEqual([]);
    expect(page.actividades()).toEqual([]);
  });

  it('salir mientras se confirma DELETE impide una eliminación tardía', async () => {
    page.consultar(7);
    let resolver!: (result: { role: string }) => void;
    dialog.onDidDismiss.mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    const eliminando = page.eliminarSeleccionada();
    await vi.waitFor(() => expect(dialog.onDidDismiss).toHaveBeenCalledOnce());
    page.ionViewWillLeave();
    resolver({ role: 'confirm' });
    await eliminando;
    expect(api.eliminar).not.toHaveBeenCalled();
    expect(page.ocupado()).toBe(false);
  });

  it('valida formulario e ID antes de llamar al servicio', () => {
    page.titulo.set('   ');
    page.crear();
    expect(api.crear).not.toHaveBeenCalled();
    expect(page.error()?.codigo).toBe('VALIDACION_LOCAL');
    page.idBusqueda.set('-1');
    page.consultarId();
    expect(api.obtener).not.toHaveBeenCalled();
    expect(page.error()?.codigo).toBe('ID_INVALIDO');
    expect(page.ocupado()).toBe(false);
  });

  it('el historial se limita a ocho solicitudes y no contiene cuerpos', () => {
    for (let i = 0; i < 10; i++) page.listar();
    expect(page.actividades()).toHaveLength(8);
    expect(page.actividades()[0].numero).toBe(10);
    expect(page.actividades()[0]).not.toHaveProperty('data');
    expect(JSON.stringify(page.actividades())).not.toContain(NOTA.descripcion);
  });
});
