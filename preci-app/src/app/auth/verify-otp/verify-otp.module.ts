import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { VerifyOtpPage } from './verify-otp.page';

const routes: Routes = [{ path: '', component: VerifyOtpPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [VerifyOtpPage],
})
export class VerifyOtpPageModule {}
