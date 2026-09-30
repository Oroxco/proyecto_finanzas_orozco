import { Component } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false
})
export class TabsPage {
  esAdmin: boolean = false;

  constructor() {}

  // Se ejecuta cada vez que se carga la barra de pestañas
  ionViewWillEnter() {
    this.verificarRol();
  }

  verificarRol() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.esAdmin = (usuario.rol_id === "1" || usuario.rol_id === 1); 
    }
  }
}