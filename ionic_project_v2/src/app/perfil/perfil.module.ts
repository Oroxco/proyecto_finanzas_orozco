
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PerfilPage } from './perfil.page';
import { PerfilPageRoutingModule } from './perfil-routing.module';

import { DiagnosticoModalModule } from '../components/diagnostico-modal/diagnostico-modal.module';
import { MetadataBluetoothModalModule } from '../components/metadata-bluetooth-modal/metadata-bluetooth-modal.module';

@NgModule({
  declarations: [
    PerfilPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilPageRoutingModule,
    DiagnosticoModalModule,
    MetadataBluetoothModalModule
  ]
})
export class PerfilPageModule {}