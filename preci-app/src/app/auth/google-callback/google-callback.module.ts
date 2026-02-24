import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { GoogleCallbackPage } from './google-callback.page';

const routes: Routes = [{ path: '', component: GoogleCallbackPage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [GoogleCallbackPage],
})
export class GoogleCallbackPageModule {}
