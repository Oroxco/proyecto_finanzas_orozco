import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaccion } from '../models/transaccion.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api/transacciones'; 

  constructor(private http: HttpClient) { }

  getTransacciones(): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(this.apiUrl);
  }
}