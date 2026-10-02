import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrigenDatosPage } from './origen-datos.page';
import { OrigenDatosPageRoutingModule } from './origen-datos-routing.module';
@NgModule({ imports: [CommonModule, FormsModule, IonicModule, OrigenDatosPageRoutingModule], declarations: [OrigenDatosPage] })
export class OrigenDatosPageModule {}
