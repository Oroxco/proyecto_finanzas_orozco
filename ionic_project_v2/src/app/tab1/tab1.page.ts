import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular'; 
import { ApiService } from '../services/api.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page {
  
  historial: any[] = [];

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {}

  async ionViewWillEnter() {
    // Verificamos conexión
    const status = await Network.getStatus();
    if (!status.connected) {
      this.mostrarMensajeToast('Sin internet: Mostrando información guardada localmente.');
    }
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.apiService.obtenerHistorial().subscribe({
      next: (data) => {
        this.historial = data || [];
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('isLogged');
    this.navCtrl.navigateRoot('/login');
  }

  async mostrarMensajeToast(msg: string) {
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