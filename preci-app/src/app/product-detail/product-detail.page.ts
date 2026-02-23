import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { ProductsService, Product } from '../core/services/products.service';
import { PricesService, PriceEntry } from '../core/services/prices.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: 'product-detail.page.html',
  styleUrls: ['product-detail.page.scss'],
  standalone: false,
})
export class ProductDetailPage implements OnInit, OnDestroy {
  product: Product | null = null;
  prices: PriceEntry[] = [];
  isLoadingProduct = true;
  isLoadingPrices = true;
  hasError = false;

  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private pricesService: PricesService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tabs/search']);
      return;
    }
    this.loadData(id);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(productId: string) {
    this.isLoadingProduct = true;
    this.isLoadingPrices = true;
    this.hasError = false;

    this.productsService
      .getById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.isLoadingProduct = false;
        },
        error: () => {
          this.isLoadingProduct = false;
          this.hasError = true;
        },
      });

    this.pricesService
      .getForProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prices) => {
          // Already sorted by price asc from backend
          this.prices = prices;
          this.isLoadingPrices = false;
        },
        error: () => {
          this.prices = [];
          this.isLoadingPrices = false;
        },
      });
  }

  // -------------------------------------------------------------------------
  // Computed helpers used in the template
  // -------------------------------------------------------------------------

  get bestPrice(): PriceEntry | null {
    return this.prices.length > 0 ? this.prices[0] : null;
  }

  get worstPrice(): number | null {
    return this.prices.length > 0
      ? this.prices[this.prices.length - 1].price
      : null;
  }

  /** Effective lowest price: use lowestPriceEver if lower than current best */
  get effectiveLowest(): number | null {
    const reported = this.bestPrice?.price ?? null;
    const ever = this.product?.lowestPriceEver ?? null;
    if (reported === null) return ever;
    if (ever === null) return reported;
    return Math.min(reported, ever);
  }

  priceBarWidth(price: number): string {
    if (this.prices.length < 2) return '100%';
    const max = Math.max(...this.prices.map(r => r.price));
    const min = Math.min(...this.prices.map(r => r.price));
    if (max === min) return '100%';
    const pct = ((price - min) / (max - min)) * 100;
    return `${Math.max(20, pct)}%`;
  }

  freshnessColor(isoDate: string): string {
    const hours = (Date.now() - new Date(isoDate).getTime()) / 3600000;
    if (hours < 6) return 'var(--preci-fresh)';
    if (hours < 48) return 'var(--preci-moderate)';
    return 'var(--preci-stale)';
  }

  /** Human-readable relative time from ISO string */
  timeAgo(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1)   return 'ahora';
    if (diffMin < 60)  return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)    return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7)     return `hace ${diffD} d`;
    const diffW = Math.floor(diffD / 7);
    if (diffW < 5)     return `hace ${diffW} sem`;
    const diffMo = Math.floor(diffD / 30);
    return `hace ${diffMo} mes${diffMo > 1 ? 'es' : ''}`;
  }

  /** Clean store name: remove "Online" suffix */
  cleanStoreName(name: string): string {
    return name ? name.replace(/\s+Online$/i, '').replace(/\+$/, '+') : name;
  }

  /** Store initial letter for avatar placeholder */
  storeInitial(name: string): string {
    const clean = this.cleanStoreName(name);
    return clean ? clean.charAt(0).toUpperCase() : '?';
  }

  /** Source label for display */
  sourceLabel(entry: PriceEntry): string {
    return entry.source === 'scraped' ? 'Web' : 'Reportado';
  }

  /** How much more expensive this entry is vs the cheapest */
  extraCost(entry: PriceEntry): number | null {
    if (!this.bestPrice || this.prices.length < 2) return null;
    const diff = entry.price - this.bestPrice.price;
    return diff > 0.01 ? diff : null;
  }

  /** Percentage bar width relative to cheapest price */
  storeBarWidth(entry: PriceEntry): number {
    if (!this.bestPrice || this.bestPrice.price === 0) return 100;
    return Math.min((entry.price / this.bestPrice.price) * 100, 100);
  }

  goBack() {
    this.router.navigate(['/tabs/search']);
  }

  navigateToReportPrice() {
    // Future: navigate to report-price page/modal with productId pre-filled
    console.log('Reportar precio para producto:', this.product?._id);
  }
}
