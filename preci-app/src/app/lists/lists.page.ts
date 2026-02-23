import { Component } from '@angular/core';

@Component({
  selector: 'app-lists',
  templateUrl: 'lists.page.html',
  styleUrls: ['lists.page.scss'],
  standalone: false,
})
export class ListsPage {
  lists: any[] = [];

  createList() {
    // TODO: Crear nueva lista de compras
    console.log('Crear lista');
  }
}
