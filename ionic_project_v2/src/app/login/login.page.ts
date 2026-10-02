import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { OrigenDatosService, DiagnosticoApi } from '../services/origen-datos.service';

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
  diagnostico: DiagnosticoApi | null = null;

  constructor(
    private navCtrl: NavController,
    private apiService: ApiService,
    private toastController: ToastController,
    private origenDatos: OrigenDatosService
  ) {}

  ngOnInit() {
    const config = this.origenDatos.getConfig();
    this.serverIp = config.apiHost;
  }

  verDiagnostico() { this.diagnostico = this.origenDatos.getDiagnostic(); }

  iniciarSesion() {
    if (!this.serverIp.trim() || !this.usuario.trim() || !this.password.trim()) {
      this.mostrarMensaje('Por favor ingresa IP del servidor, usuario y contraseña');
      return;
    }

    const config = this.origenDatos.getConfig();
    const inputHost = this.serverIp.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const parts = inputHost.match(/^([^:]+)(?::(\d+))?$/);
    if (parts) {
      config.apiHost = parts[1];
      if (parts[2]) config.apiPort = Number(parts[2]);
      this.origenDatos.saveConfig(config);
    }

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
          this.diagnostico = this.origenDatos.recordDiagnostic({ error: respuesta?.mensaje || 'Credenciales incorrectas', payload: { username: this.usuario.trim(), password: '[REDACTADO]' } });
          this.mostrarMensaje(respuesta?.mensaje || 'Credenciales incorrectas');
        }
      },
      error: (err) => {
        this.diagnostico = this.origenDatos.recordDiagnostic({ error: err?.message || 'Error de conexión', payload: { username: this.usuario.trim(), password: '[REDACTADO]' }, cabeceras: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
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