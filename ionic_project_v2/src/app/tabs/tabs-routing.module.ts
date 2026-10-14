import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadChildren: () =>
          import('../tab1/tab1.module').then(m => m.Tab1PageModule)
      },
      {
        path: 'tab2',
        loadChildren: () =>
          import('../tab2/tab2.module').then(m => m.Tab2PageModule)
      },
      {
        path: 'tab3',
        loadChildren: () =>
          import('../tab3/tab3.module').then(m => m.Tab3PageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('../perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: 'origen-datos',
        loadChildren: () => import('../origen-datos/origen-datos.module').then(m => m.OrigenDatosPageModule)
      },
      {
        path: 'graficas',
        loadChildren: () => import('../graficas/graficas.module').then(m => m.GraficasPageModule)
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full'
      },
      {
        path: 'editor-foto',
        loadChildren: () => import('../editor-foto/editor-foto.module').then(m => m.EditorFotoPageModule)
      },
      {
        path: 'api-rest',
        loadChildren: () =>import('../api-rest/api-rest.module').then(m => m.ApiRestPageModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}