import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  // TODO: Cargar datos del usuario autenticado
  user = {
    displayName: 'Usuario',
    level: 'nuevo',
    points: 0,
    totalReports: 0,
  };

  login() {
    // TODO: Navegar a login
    console.log('Login');
  }
}
