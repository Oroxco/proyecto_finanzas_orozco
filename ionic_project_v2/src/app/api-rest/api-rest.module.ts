import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiRestPage } from './api-rest.page';
import { ApiRestPageRoutingModule } from './api-rest-routing.module';

@NgModule({
  declarations: [ApiRestPage],
  imports: [CommonModule, FormsModule, IonicModule, ApiRestPageRoutingModule],
})
export class ApiRestPageModule {}
