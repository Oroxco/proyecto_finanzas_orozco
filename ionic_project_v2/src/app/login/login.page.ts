import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  serverIp: string = 'localhost';
  usuario: string = '';
  password: string = '';

  constructor(
    private navCtrl: NavController,
    private apiService: ApiService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const savedIp = localStorage.getItem('server_ip');
    if (savedIp) {
      this.serverIp = savedIp;
    }
  }

  iniciarSesion() {
    if (!this.serverIp.trim() || !this.usuario.trim() || !this.password.trim()) {
      this.mostrarMensaje('Por favor ingresa IP del servidor, usuario y contraseña');
      return;
    }

    localStorage.setItem('server_ip', this.serverIp.trim());

    const credenciales = {
      username: this.usuario.trim(),
      password: this.password.trim()
    };

    this.apiService.login(credenciales).subscribe({
      next: (respuesta: any) => {
        if (respuesta && respuesta.success) {
          localStorage.setItem('usuarioLogueado', JSON.stringify(respuesta.usuario || respuesta));
          localStorage.setItem('isLogged', 'true');
          this.navCtrl.navigateRoot('/tabs');
        } else {
          this.mostrarMensaje(respuesta?.mensaje || 'Credenciales incorrectas');
        }
      },
      error: (err) => {
        console.error('Error de conexión:', err);
        this.mostrarMensaje('Error al conectar con el servidor');
      }
    });
  }

  async mostrarMensaje(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}