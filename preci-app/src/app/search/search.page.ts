import { Component } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  standalone: false,
})
export class SearchPage {
  searchQuery = '';
  results: any[] = [];
  isLoading = false;

  onSearch() {
    if (!this.searchQuery.trim()) return;
    // TODO: Llamar a ProductsService.search()
    console.log('Buscando:', this.searchQuery);
  }
}
