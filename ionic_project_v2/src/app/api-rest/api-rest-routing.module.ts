import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiRestPage } from './api-rest.page';

const routes: Routes = [{ path: '', component: ApiRestPage }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ApiRestPageRoutingModule {}
