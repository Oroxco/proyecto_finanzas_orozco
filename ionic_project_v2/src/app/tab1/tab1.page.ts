import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page {
  contacto = { nombre: '', empresa: '', email: '', mensaje: '' };

  constructor(private router: Router) {}

  enviarMensaje() {
    alert(`Mensaje enviado por ${this.contacto.nombre || 'usuario'}`);
    this.contacto = { nombre: '', empresa: '', email: '', mensaje: '' };
  }

  cerrarSesion() {
    this.router.navigateByUrl('/login');
  }
}