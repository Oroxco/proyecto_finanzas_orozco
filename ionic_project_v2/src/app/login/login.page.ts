import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  usuario: string = '';
  password: string = '';

  constructor(private navCtrl: NavController) {}

  iniciarSesion() {
    console.log('Datos ingresados:', this.usuario, this.password);

    if (this.usuario.trim() === 'admin' && this.password.trim() === '1234') {
      // 1. Guardar estado de sesión en el almacenamiento local
      localStorage.setItem('isLogged', 'true');

      // 2. Usar NavController de Ionic para forzar la navegación raíz
      this.navCtrl.navigateRoot('/tabs');
    } else {
      alert('Credenciales incorrectas (Usa admin / 1234)');
    }
  }
}