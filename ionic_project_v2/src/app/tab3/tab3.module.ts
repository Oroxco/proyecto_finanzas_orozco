import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { DiagnosticoModalModule } from '../components/diagnostico-modal/diagnostico-modal.module';
import { Tab3PageRoutingModule } from './tab3-routing.module';

@NgModule({
  imports: [
    IonicModule, // Contiene las directivas ion-header, ion-content, etc.
    CommonModule,
    FormsModule,
    DiagnosticoModalModule,
    Tab3PageRoutingModule
  ],
  declarations: [Tab3Page] // Se declara de la forma clásica
})
export class Tab3PageModule {}