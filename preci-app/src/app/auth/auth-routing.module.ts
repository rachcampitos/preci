import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'verify-otp',
    loadChildren: () =>
      import('./verify-otp/verify-otp.module').then((m) => m.VerifyOtpPageModule),
  },
  {
    path: 'google/callback',
    loadChildren: () =>
      import('./google-callback/google-callback.module').then(
        (m) => m.GoogleCallbackPageModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
