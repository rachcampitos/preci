import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from '../core/services/products.service';
import { BestPriceData } from '../shared/components/product-card/product-card.component';

interface CategoryPill {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryPill[] = [
  { key: 'lacteos', label: 'Lacteos', icon: 'water-outline' },
  { key: 'carnes', label: 'Carnes', icon: 'restaurant-outline' },
  { key: 'frutas_verduras', label: 'Frutas y Verduras', icon: 'nutrition-outline' },
  { key: 'granos_cereales', label: 'Granos', icon: 'basket-outline' },
  { key: 'bebidas', label: 'Bebidas', icon: 'beer-outline' },
  { key: 'panaderia', label: 'Panaderia', icon: 'cafe-outline' },
  { key: 'limpieza', label: 'Limpieza', icon: 'sparkles-outline' },
  { key: 'aceites', label: 'Aceites', icon: 'flask-outline' },
];

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
  filteredProducts: Product[] = [];
  isLoading = false;
  hasSearched = false;
  activeCategory = '';
  categories = CATEGORIES;

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

  get activeCategoryLabel(): string {
    const cat = CATEGORIES.find((c) => c.key === this.activeCategory);
    return cat ? cat.label : 'Productos populares';
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

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }

  filterByCategory(key: string) {
    this.activeCategory = key;

    if (!key) {
      this.filteredProducts = this.popularProducts;
      return;
    }

    this.filteredProducts = this.popularProducts.filter((p) => p.category === key);
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
      next: (products) => {
        this.popularProducts = products;
        this.filteredProducts = products;
      },
      error: () => {},
    });
  }
}
