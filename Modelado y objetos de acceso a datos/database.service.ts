import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, MensajeContacto, Rol } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  // Apunta a tu servidor local de XAMPP con el puerto correcto
  private apiUrl = 'http://localhost:8080/api_ionic/api.php';

  // Inyectamos HttpClient para hacer peticiones HTTP (GET, POST, PUT, DELETE)
  constructor(private http: HttpClient) { }

  // --- OPERACIONES CRUD BÁSICAS (USUARIOS) ---

  // READ (Obtener todos)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?tabla=usuarios`);
  }

  // CREATE (Agregar uno nuevo)
  agregarUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=usuarios`, usuario);
  }

  // UPDATE (Editar existente)
  actualizarUsuario(id: number, usuario: Usuario): Observable<any> {
    return this.http.put(`${this.apiUrl}?tabla=usuarios&id=${id}`, usuario);
  }

  // DELETE (Eliminar uno)
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?tabla=usuarios&id=${id}`);
  }

  // --- OPERACIONES PARA OTRAS TABLAS ---

  // READ (Obtener Roles)
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}?tabla=roles`);
  }

  // CREATE (Enviar Mensaje de Contacto)
  enviarMensaje(mensaje: MensajeContacto): Observable<any> {
    return this.http.post(`${this.apiUrl}?tabla=mensajes`, mensaje);
  }
}