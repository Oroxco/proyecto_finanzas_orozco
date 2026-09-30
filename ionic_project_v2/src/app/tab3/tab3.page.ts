import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import Chart from 'chart.js/auto';
import { Network } from '@capacitor/network';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page {
  @ViewChild('graficaCanvas') graficaCanvas!: ElementRef;
  chart: any;
  
  balanceTotal = 0;
  ingresosTotales = 0;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {}

  async ionViewWillEnter() {
    // Verificamos conexión
    const status = await Network.getStatus();
    if (!status.connected) {
      this.mostrarMensajeToast('Sin internet: Mostrando información guardada localmente.');
    }
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.apiService.obtenerDashboard().subscribe({
      next: (res: any) => {
        console.log('Respuesta del Backend:', res);

        this.balanceTotal = parseFloat(res.balance || 0);
        this.ingresosTotales = parseFloat(res.ingresos || 0);

        this.cdr.detectChanges();

        if (res.grafica) {
          this.dibujarGrafica(res.grafica);
        }
      },
      error: (err) => console.error('Error al cargar dashboard:', err)
    });
  }

  dibujarGrafica(datosSQL: any[]) {
    if (this.chart) this.chart.destroy();

    const etiquetas = [...new Set(datosSQL.map(d => d.dia))];
    const ingresosData = etiquetas.map(dia => {
      const reg = datosSQL.find(d => d.dia === dia && d.tipo === 'ingreso');
      return reg ? parseFloat(reg.total) : 0;
    });
    const gastosData = etiquetas.map(dia => {
      const reg = datosSQL.find(d => d.dia === dia && d.tipo === 'gasto');
      return reg ? parseFloat(reg.total) : 0;
    });

    this.chart = new Chart(this.graficaCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [
          { label: 'Ingresos', data: ingresosData, backgroundColor: '#2dd36f', borderRadius: 4 },
          { label: 'Gastos', data: gastosData, backgroundColor: '#eb445a', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#ffffff' } } },
        scales: {
          y: { ticks: { color: '#a1a1a1' }, grid: { color: '#333' } },
          x: { ticks: { color: '#a1a1a1' }, grid: { display: false } }
        }
      }
    });
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