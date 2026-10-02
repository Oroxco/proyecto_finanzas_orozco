import { Component } from '@angular/core';
import { OrigenDatosService, DiagnosticoApi } from '../../services/origen-datos.service';
@Component({ selector: 'app-diagnostico-modal', templateUrl: './diagnostico-modal.component.html', standalone: false })
export class DiagnosticoModalComponent {
  abierto = false;
  diagnostico: DiagnosticoApi | null = null;
  constructor(private origenDatos: OrigenDatosService) {}
  abrir() { this.diagnostico = this.origenDatos.getDiagnostic() || this.origenDatos.recordDiagnostic({ payload: {}, error: 'Todavía no hay errores registrados.' }); this.abierto = true; }
}
