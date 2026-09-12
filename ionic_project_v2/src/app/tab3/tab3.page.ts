import { Component } from '@angular/core';
import { ViewDidEnter } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
// 1. Importamos el servicio
import { ApiService } from '../services/api.service'; 

Chart.register(...registerables);

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false 
})
export class Tab3Page implements ViewDidEnter {
  chart: any;

  // 2. Inyectamos el servicio en el constructor
  constructor(private apiService: ApiService) {}

  ionViewDidEnter() {
    // 3. Llamamos a la API de Node.js / MySQL
    this.apiService.getTransacciones().subscribe({
      next: (datos) => {
        console.log('✅ Datos traídos desde MySQL:', datos);
      },
      error: (error) => {
        console.error('❌ Error al cargar datos:', error);
      }
    });

    // 4. Mantenemos la generación de tu gráfica intacta
    setTimeout(() => {
      this.createChart();
    }, 150);
  }

  // 5. Método para los botones "Ver detalles" de tus tarjetas
  verDetalles(tipo: string) {
    console.log('Se solicitó ver los detalles de:', tipo);
  }

  createChart() {
    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }
    
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Ingresos',
            data: [40, 60, 45, 80, 55, 90],
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Gastos',
            data: [65, 59, 80, 50, 40, 55],
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#4b545c' }, ticks: { color: '#adb5bd' } },
          y: { grid: { color: '#4b545c' }, ticks: { color: '#adb5bd' } }
        }
      }
    });
  }
}