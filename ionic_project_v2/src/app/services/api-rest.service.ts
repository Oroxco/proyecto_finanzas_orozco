import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';

export interface NotaRest {
  id: number;
  titulo: string;
  descripcion: string;
  creado_en: string;
  actualizado_en: string;
}

export interface NotaRestEntrada {
  titulo: string;
  descripcion: string;
}

export interface ResultadoRest<T> {
  data: T;
  mensaje: string;
  status: number;
}

/** Sólo conserva información pública del contrato; nunca expone SQL o trazas. */
export class ErrorApiRest extends Error {
  constructor(public readonly status: number, public readonly codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorApiRest';
  }
}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function textoPublico(value: unknown, fallback: string, maxLength = 240): string {
  if (typeof value !== 'string') return fallback;
  const texto = value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return texto ? texto.slice(0, maxLength) : fallback;
}

export function normalizarErrorRest(error: unknown): ErrorApiRest {
  if (error instanceof ErrorApiRest) return error;
  if (error instanceof TimeoutError) {
    return new ErrorApiRest(0, 'TIEMPO_AGOTADO', 'La API tardó demasiado. Comprueba que Apache y MySQL estén activos en XAMPP.');
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new ErrorApiRest(0, 'SIN_CONEXION', 'No se pudo conectar con la API PHP. Revisa la URL, Apache en XAMPP y los permisos CORS. En Android usa la IP de tu computadora.');
    }
    // El backend utiliza este sobre para errores de validación y disponibilidad.
    const cuerpo: unknown = error.error;
    if ([400, 404, 503].includes(error.status) && esObjeto(cuerpo) && esObjeto(cuerpo['error'])) {
      return new ErrorApiRest(
        error.status,
        textoPublico(cuerpo['error']['codigo'], 'ERROR_API', 60),
        textoPublico(cuerpo['error']['mensaje'], 'La API no pudo completar la solicitud.'),
      );
    }
    const mensaje = error.status === 404 ? 'No se encontró el recurso solicitado.'
      : error.status === 503 ? 'El servicio no está disponible. Comprueba la conexión con MySQL.'
      : 'El servidor no pudo completar la solicitud.';
    return new ErrorApiRest(error.status, 'ERROR_HTTP', mensaje);
  }
  return new ErrorApiRest(0, 'ERROR_CLIENTE', 'No se pudo completar la solicitud. Inténtalo nuevamente.');
}

function esNota(value: unknown): value is NotaRest {
  return esObjeto(value) && Number.isSafeInteger(value['id']) && Number(value['id']) > 0
    && typeof value['titulo'] === 'string' && typeof value['descripcion'] === 'string'
    && typeof value['creado_en'] === 'string' && typeof value['actualizado_en'] === 'string';
}

@Injectable({ providedIn: 'root' })
export class ApiRestService {
  private url = 'http://localhost:8080/api_ionic/demo_rest.php';
  readonly tiempoLimiteMs = 15000;

  constructor(private readonly http: HttpClient) {}

  get baseUrl(): string { return this.url; }

  /** URL de consulta; la URL editable permanece sin parámetros. */
  get collectionUrl(): string { return `${this.url}?${this.parametros().toString()}`; }

  configurarUrl(value: string): string {
    let parsed: URL;
    try { parsed = new URL(value.trim()); }
    catch { throw new ErrorApiRest(0, 'URL_INVALIDA', 'Escribe una URL completa, por ejemplo http://localhost:8080/api_ionic/demo_rest.php.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new ErrorApiRest(0, 'URL_INVALIDA', 'La URL debe usar HTTP o HTTPS, sin credenciales, parámetros ni fragmentos.');
    }
    this.url = parsed.toString().replace(/\/+$/, '');
    return this.url;
  }

  listar(): Observable<ResultadoRest<NotaRest[]>> {
    return this.peticion(this.http.get<unknown>(this.url, { observe: 'response', params: this.parametros() }),
      (data): data is NotaRest[] => Array.isArray(data) && data.every(esNota));
  }

  obtener(id: number): Observable<ResultadoRest<NotaRest>> {
    return this.peticion(this.http.get<unknown>(this.url, { observe: 'response', params: this.parametros(id) }), esNota);
  }

  crear(entrada: NotaRestEntrada): Observable<ResultadoRest<NotaRest>> {
    return this.peticion(this.http.post<unknown>(this.url, entrada, { observe: 'response', params: this.parametros() }), esNota);
  }

  reemplazar(id: number, entrada: NotaRestEntrada): Observable<ResultadoRest<NotaRest>> {
    return this.peticion(this.http.put<unknown>(this.url, entrada, { observe: 'response', params: this.parametros(id) }), esNota);
  }

  actualizarTitulo(id: number, titulo: string): Observable<ResultadoRest<NotaRest>> {
    // PATCH manda sólo el campo que cambia; la descripción queda intacta.
    return this.peticion(this.http.patch<unknown>(this.url, { titulo }, { observe: 'response', params: this.parametros(id) }), esNota);
  }

  eliminar(id: number): Observable<ResultadoRest<{ id: number }>> {
    return this.peticion(this.http.delete<unknown>(this.url, { observe: 'response', params: this.parametros(id) }),
      (data): data is { id: number } => esObjeto(data) && data['id'] === id);
  }

  private parametros(id?: number): HttpParams {
    const params = new HttpParams().set('recurso', 'notas');
    if (id === undefined) return params;
    if (!Number.isSafeInteger(id) || id <= 0) throw new ErrorApiRest(0, 'ID_INVALIDO', 'Selecciona una nota válida.');
    return params.set('id', id);
  }

  private peticion<T>(peticion: Observable<HttpResponse<unknown>>, validar: (data: unknown) => data is T): Observable<ResultadoRest<T>> {
    return peticion.pipe(
      timeout(this.tiempoLimiteMs),
      map(response => {
        const body = response.body;
        if (!esObjeto(body) || !validar(body['data'])) {
          throw new ErrorApiRest(response.status, 'RESPUESTA_INVALIDA', 'La API devolvió una respuesta con un formato inesperado.');
        }
        return { data: body['data'], status: response.status, mensaje: textoPublico(body['mensaje'], 'Solicitud completada.') };
      }),
      catchError((error: unknown) => throwError(() => normalizarErrorRest(error))),
    );
  }
}
