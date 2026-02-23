import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from '../core/services/products.service';
import { BestPriceData } from '../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  searchQuery = '';
  results: Product[] = [];
  popularProducts: Product[] = [];
  isLoading = false;
  hasSearched = false;

  constructor(
    private productsService: ProductsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadPopular();

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

  getLowestPrice(product: Product): BestPriceData | undefined {
    if (!product.lowestPriceEver) return undefined;
    return {
      price: product.lowestPriceEver,
      storeName: 'desde',
    };
  }

  navigateToProduct(product: Product) {
    const id = product._id;
    if (!id) return;
    this.router.navigate(['/tabs/product', id]);
  }

  private loadPopular() {
    this.productsService.getPopular(30).subscribe({
      next: (products) => (this.popularProducts = products),
      error: () => {},
    });
  }
}
