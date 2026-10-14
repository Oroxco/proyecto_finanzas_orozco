import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRestService, ErrorApiRest, NotaRest, normalizarErrorRest, textoPublico } from './api-rest.service';

const NOTA: NotaRest = {
  id: 7, titulo: 'Nota de prueba', descripcion: 'Descripción persistente',
  creado_en: '2026-10-14T12:00:00.000Z', actualizado_en: '2026-10-14T12:00:00.000Z',
};
const URL_BASE = 'http://localhost:8080/api_ionic/demo_rest.php';
const URL_API = `${URL_BASE}?recurso=notas`;

describe('ApiRestService: contrato y solicitudes HTTP reales', () => {
  let service: ApiRestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiRestService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ApiRestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify({ ignoreCancelled: true });
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('GET colección conserva el estado HTTP y los datos del servidor', () => {
    const next = vi.fn();
    service.listar().subscribe(next);
    const request = http.expectOne(URL_API);
    expect(request.request.method).toBe('GET');
    expect(request.request.url).toBe(URL_BASE);
    expect(request.request.params.get('recurso')).toBe('notas');
    expect(request.request.params.has('id')).toBe(false);
    expect(service.collectionUrl).toBe(URL_API);
    request.flush({ data: [NOTA], mensaje: 'Notas consultadas.' });
    expect(next).toHaveBeenCalledWith({ data: [NOTA], mensaje: 'Notas consultadas.', status: 200 });
  });

  it('GET detalle usa el ID solicitado', () => {
    const next = vi.fn();
    service.obtener(7).subscribe(next);
    const request = http.expectOne(`${URL_API}&id=7`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('id')).toBe('7');
    request.flush({ data: NOTA });
    expect(next.mock.calls[0][0].data.id).toBe(7);
  });

  it('POST envía ambos campos y conserva HTTP 201', () => {
    const next = vi.fn();
    const entrada = { titulo: 'Nueva', descripcion: 'Creada en MySQL' };
    service.crear(entrada).subscribe(next);
    const request = http.expectOne(URL_API);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(entrada);
    request.flush({ data: { ...NOTA, ...entrada }, mensaje: 'Creada.' }, { status: 201, statusText: 'Created' });
    expect(next.mock.calls[0][0].status).toBe(201);
  });

  it('PUT reemplaza título y descripción; PATCH sólo envía título', () => {
    const entrada = { titulo: 'Reemplazada', descripcion: 'Cambió también' };
    service.reemplazar(7, entrada).subscribe();
    const put = http.expectOne(`${URL_API}&id=7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(entrada);
    put.flush({ data: { ...NOTA, ...entrada } });
    service.actualizarTitulo(7, 'Sólo título').subscribe();
    const patch = http.expectOne(`${URL_API}&id=7`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ titulo: 'Sólo título' });
    expect(patch.request.body).not.toHaveProperty('descripcion');
    patch.flush({ data: { ...NOTA, titulo: 'Sólo título' } });
  });

  it('DELETE solicita el recurso por ID y verifica la confirmación de borrado', () => {
    const next = vi.fn();
    service.eliminar(7).subscribe(next);
    const request = http.expectOne(`${URL_API}&id=7`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ data: { id: 7 }, mensaje: 'Eliminada.' });
    expect(next).toHaveBeenCalledWith({ data: { id: 7 }, mensaje: 'Eliminada.', status: 200 });
  });

  it.each([400, 404, 503])('propaga HTTP %i con el mensaje público del backend', status => {
    const error = vi.fn();
    service.listar().subscribe({ error });
    const request = http.expectOne(URL_API);
    request.flush({ error: { codigo: 'PRUEBA_API', mensaje: '<b>Mensaje público</b>\nRevisa la solicitud.' } }, { status, statusText: 'Error' });
    expect(error.mock.calls[0][0]).toBeInstanceOf(ErrorApiRest);
    expect(error.mock.calls[0][0]).toMatchObject({ status, codigo: 'PRUEBA_API', message: 'Mensaje público Revisa la solicitud.' });
  });

  it('un error de red no se transforma en una respuesta exitosa', () => {
    const next = vi.fn();
    const error = vi.fn();
    service.listar().subscribe({ next, error });
    http.expectOne(URL_API).error(new ProgressEvent('error'));
    expect(next).not.toHaveBeenCalled();
    expect(error.mock.calls[0][0]).toMatchObject({ status: 0, codigo: 'SIN_CONEXION' });
  });

  it('rechaza datos que incumplen el contrato aunque el servidor responda 200', () => {
    const next = vi.fn();
    const error = vi.fn();
    service.listar().subscribe({ next, error });
    http.expectOne(URL_API).flush({ data: [{ id: 7, titulo: 'Faltan campos' }] });
    expect(next).not.toHaveBeenCalled();
    expect(error.mock.calls[0][0]).toMatchObject({ status: 200, codigo: 'RESPUESTA_INVALIDA' });
  });

  it('permite usar la IP Android sin cambiar los endpoints', () => {
    expect(service.configurarUrl(' http://192.168.1.10:8080/api_ionic/demo_rest.php ')).toBe('http://192.168.1.10:8080/api_ionic/demo_rest.php');
    service.listar().subscribe();
    http.expectOne('http://192.168.1.10:8080/api_ionic/demo_rest.php?recurso=notas').flush({ data: [] });
    expect(service.collectionUrl).toBe('http://192.168.1.10:8080/api_ionic/demo_rest.php?recurso=notas');
  });

  it.each(['javascript:alert(1)', 'http://usuario:clave@localhost:8080/api_ionic/demo_rest.php', 'http://localhost:8080/api_ionic/demo_rest.php?token=secret', 'no-es-url'])('rechaza una URL inválida: %s', url => {
    expect(() => service.configurarUrl(url)).toThrow(ErrorApiRest);
    expect(service.baseUrl).toBe(URL_BASE);
    http.expectNone(URL_API);
  });

  it('rechaza IDs inválidos antes de enviar una petición', () => {
    expect(() => service.obtener(-1)).toThrow(ErrorApiRest);
    expect(() => service.eliminar(1.5)).toThrow(ErrorApiRest);
    http.expectNone(URL_API);
  });

  it('limita el tiempo de espera y cancela la solicitud pendiente', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.listar().subscribe({ error });
    const request = http.expectOne(URL_API);
    vi.advanceTimersByTime(service.tiempoLimiteMs);
    expect(request.cancelled).toBe(true);
    expect(error.mock.calls[0][0]).toMatchObject({ status: 0, codigo: 'TIEMPO_AGOTADO' });
  });

  it('no muestra trazas o SQL cuando el servidor devuelve un error no público', () => {
    const result = normalizarErrorRest(new HttpErrorResponse({ status: 500, error: { error: { mensaje: 'SELECT password FROM usuarios' } } }));
    expect(result.message).not.toContain('SELECT');
    expect(result.status).toBe(500);
    expect(textoPublico('<img>\u0000hola', 'fallback')).toBe('hola');
    expect(textoPublico('a'.repeat(500), 'fallback')).toHaveLength(240);
  });
});
