import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EditorFotoPage } from './editor-foto.page';
import { EditorFotoPageRoutingModule } from './editor-foto-routing.module';

@NgModule({
  declarations: [EditorFotoPage],
  imports: [CommonModule, IonicModule, EditorFotoPageRoutingModule],
})
export class EditorFotoPageModule {}
