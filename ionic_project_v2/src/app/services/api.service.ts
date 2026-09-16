import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, MensajeContacto, Rol } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Asegúrate de usar el puerto 8080 que descubrimos que usa tu XAMPP
  private apiUrl = 'http://localhost:8080/api_ionic/api.php';

  constructor(private http: HttpClient) { }

  // --- CRUD USUARIOS ---
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?tabla=usuarios`);
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

  // --- CRUD MENSAJES CONTACTO ---
  enviarMensaje(mensaje: MensajeContacto): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=mensajes`, mensaje);
  }
  obtenerMensajes(): Observable<MensajeContacto[]> {
    return this.http.get<MensajeContacto[]>(`${this.apiUrl}?tabla=mensajes`);
  }

  // --- ROLES ---
  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}?tabla=roles`);
  }
}