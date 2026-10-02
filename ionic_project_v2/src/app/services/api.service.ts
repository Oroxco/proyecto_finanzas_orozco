import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario, MensajeContacto, Rol } from '../models/models';
import { OrigenDatosService } from './origen-datos.service';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient, private origenDatos: OrigenDatosService) { }

  private get apiUrl(): string { return this.origenDatos.getApiUrl(); }

  login(credenciales: { username: string, password: string }): Observable<any> {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    this.origenDatos.recordDiagnostic({
      metodo: 'POST', url: `${this.apiUrl}?tabla=login`,
      payload: { username: credenciales.username, password: '[REDACTADO]' },
      cabeceras: headers
    });
    return this.http.post(`${this.apiUrl}?tabla=login`, credenciales, { headers });
  }

  // --- ESTRATEGIA DE CACHÉ Y MANEJO DE ERRORES ---
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?tabla=usuarios`).pipe(
      tap((usuarios) => {
        // Si hay éxito, guardamos silenciosamente en caché
        localStorage.setItem('usuarios_cache', JSON.stringify(usuarios));
      }),
      catchError((error) => {
        console.warn('Fallo de conexión. Intentando recuperar caché...', error);
        const cache = localStorage.getItem('usuarios_cache');
        if (cache) {
          // Retornamos la caché como si fuera la respuesta real
          return of(JSON.parse(cache) as Usuario[]); 
        }
        // Si no hay internet ni caché, arrojamos un error controlable
        return throwError(() => new Error('Sin conexión y sin datos guardados.'));
      })
    );
  }

  crearUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=usuarios`, usuario);
  }

  actualizarUsuario(id: number, usuario: Usuario): Observable<any> {
    return this.http.put(`${this.apiUrl}?tabla=usuarios&id=${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?tabla=usuarios&id=${id}`);
  }

  enviarMensaje(mensaje: MensajeContacto): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=mensajes`, mensaje);
  }

  obtenerMensajes(): Observable<MensajeContacto[]> {
    return this.http.get<MensajeContacto[]>(`${this.apiUrl}?tabla=mensajes`);
  }

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}?tabla=roles`);
  }

  registrarTransaccion(data: { usuario_id: number, tipo: string, monto: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=transacciones`, data);
  }

  obtenerDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}?tabla=dashboard`);
  }

  obtenerHistorial(): Observable<any> {
    return this.http.get(`${this.apiUrl}?tabla=transacciones`);
  }
}