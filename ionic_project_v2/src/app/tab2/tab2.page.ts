import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false 
})
export class Tab2Page implements OnInit {
  nuevoUsuario = { nombre: '', email: '' };
  usuarios: Array<{ id: number; nombre: string; email: string }> = [];

  ngOnInit() {
    const guardados = localStorage.getItem('mis_usuarios');
    if (guardados) {
      this.usuarios = JSON.parse(guardados);
    } else {
      this.usuarios = [
        { id: 1, nombre: 'Ana Gómez', email: 'ana@example.com' },
        { id: 2, nombre: 'Carlos Ruiz', email: 'carlos@example.com' }
      ];
      this.guardarEnStorage();
    }
  }

  agregarUsuario() {
    if (this.nuevoUsuario.nombre && this.nuevoUsuario.email) {
      this.usuarios.push({
        id: Date.now(),
        nombre: this.nuevoUsuario.nombre,
        email: this.nuevoUsuario.email
      });
      this.guardarEnStorage();
      this.nuevoUsuario = { nombre: '', email: '' };
    }
  }

  eliminarUsuario(id: number) {
    this.usuarios = this.usuarios.filter(user => user.id !== id);
    this.guardarEnStorage();
  }

  private guardarEnStorage() {
    localStorage.setItem('mis_usuarios', JSON.stringify(this.usuarios));
  }
}