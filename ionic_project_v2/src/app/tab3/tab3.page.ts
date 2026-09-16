import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service'; // O DatabaseService, según cómo lo hayas nombrado
import { Usuario } from '../models/interfaces'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {

  // Variable para guardar los datos
  usuarios: Usuario[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Cambiamos getTransacciones() por getUsuarios() u obtenerUsuarios()
    // Y le agregamos los tipos de dato a (datos: Usuario[]) y (error: any)
    this.apiService.obtenerUsuarios().subscribe({
      next: (datos: Usuario[]) => {
        console.log('Datos recibidos:', datos);
        this.usuarios = datos;
      },
      error: (error: any) => {
        console.error('Error al cargar la información:', error);
      }
    });
  }
}