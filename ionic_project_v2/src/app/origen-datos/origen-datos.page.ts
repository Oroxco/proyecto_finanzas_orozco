import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { OrigenDatos, OrigenDatosService } from '../services/origen-datos.service';
@Component({ selector: 'app-origen-datos', templateUrl: './origen-datos.page.html', styleUrls: ['./origen-datos.page.scss'], standalone: false })
export class OrigenDatosPage {
  config: OrigenDatos;
  constructor(private origen: OrigenDatosService, private toast: ToastController) { this.config = this.origen.getConfig(); }
  async guardar() {
    if (!this.config.apiHost.trim() || !this.config.apiPath.trim() || !this.config.apiPort || !this.config.dbHost.trim() || !this.config.dbName.trim() || !this.config.dbPort) {
      const t = await this.toast.create({ message: 'Completa host, ruta y puertos válidos.', duration: 2500, color: 'danger' }); await t.present(); return;
    }
    this.origen.saveConfig(this.config);
    const t = await this.toast.create({ message: 'Origen de datos guardado. Las siguientes llamadas API usarán esta configuración.', duration: 3000, color: 'success' }); await t.present();
  }
  verJson() { return JSON.stringify(this.config, null, 2); }
  descargarJson() {
    const blob = new Blob([JSON.stringify(this.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'origen-datos.json'; a.click(); URL.revokeObjectURL(url);
  }
}
