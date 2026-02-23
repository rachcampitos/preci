import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from '../core/services/products.service';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  searchQuery = '';
  results: Product[] = [];
  basketProducts: Product[] = [];
  isLoading = false;
  hasSearched = false;

  constructor(
    private productsService: ProductsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadBasket();

    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.onSearch();
      }
    });
  }

  onSearch() {
    const query = this.searchQuery.trim();
    if (!query) {
      this.results = [];
      this.hasSearched = false;
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.productsService.search(query).subscribe({
      next: (products) => {
        this.results = products;
        this.isLoading = false;
      },
      error: () => {
        this.results = [];
        this.isLoading = false;
      },
    });
  }

  navigateToProduct(product: Product) {
    const id = product._id;
    if (!id) return;
    this.router.navigate(['/tabs/product', id]);
  }

  private loadBasket() {
    this.productsService.getBasket().subscribe({
      next: (products) => (this.basketProducts = products),
      error: () => {},
    });
  }
}
