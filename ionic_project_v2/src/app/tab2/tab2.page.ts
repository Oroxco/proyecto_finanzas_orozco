import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page {
  nuevoUsuario = { nombre: '', email: '' };
  usuarios: any[] = [];
  conectado: boolean = true; // Para saber si tenemos red

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private alertController: AlertController,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    // 1. Detección del estado de conexión
    const status = await Network.getStatus();
    this.conectado = status.connected;

    if (!this.conectado) {
      this.mostrarMensajeToast('Sin internet: Mostrando información guardada localmente.', 'warning');
    }

    // 2. Consumo de la API (con caché automático gracias al ApiService)
    this.apiService.obtenerUsuarios().subscribe({
      next: (datos) => {
        this.usuarios = datos;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarMensajeToast('Error: No se pudo conectar con el servidor y no hay caché disponible.', 'danger');
        console.error('Error al cargar datos:', err);
      }
    });
  }

  async agregarUsuario() {
    const status = await Network.getStatus();
    if (!status.connected) {
      this.mostrarMensajeToast('No puedes crear usuarios sin conexión a internet.', 'danger');
      return;
    }

    if (this.nuevoUsuario.nombre && this.nuevoUsuario.email) {
      this.apiService.crearUsuario(this.nuevoUsuario as any).subscribe(() => {
        this.nuevoUsuario = { nombre: '', email: '' }; 
        this.cargarUsuarios(); 
      });
    }
  }

  async eliminarUsuario(id: number) {
    const status = await Network.getStatus();
    if (!status.connected) {
      this.mostrarMensajeToast('No puedes eliminar usuarios sin conexión a internet.', 'danger');
      return;
    }
    this.apiService.eliminarUsuario(id).subscribe(() => this.cargarUsuarios());
  }

  async procesarDinero(usuarioId: number, tipo: 'ingreso' | 'gasto') {
    const status = await Network.getStatus();
    if (!status.connected) {
      this.mostrarMensajeToast('Las transacciones requieren conexión a internet.', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: tipo === 'ingreso' ? 'Ingresar Fondos' : 'Descontar Fondos',
      inputs: [{ name: 'monto', type: 'number', placeholder: 'Cantidad ($)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Confirmar', 
          handler: (data) => {
            if(data.monto && Number(data.monto) > 0) {
              this.apiService.registrarTransaccion({
                usuario_id: usuarioId,
                tipo: tipo,
                monto: Number(data.monto)
              }).subscribe(() => this.cargarUsuarios()); 
            }
          }
        }
      ]
    });
    await alert.present();
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.navCtrl.navigateRoot('/login');
  }

  // --- MENSAJES ADECUADOS AL USUARIO ---
  async mostrarMensajeToast(msg: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3500,
      position: 'top', 
      cssClass: 'toast-offline', 
      buttons: [{ text: 'CERRAR', role: 'cancel' }]
    });
    await toast.present();
  }
}