import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, forkJoin } from 'rxjs';
import { ProductsService, Product } from '../core/services/products.service';
import { ApiService } from '../core/services/api.service';

// Price report shape returned by GET /price-reports/product/:productId
export interface PriceReportStore {
  _id: string;
  name: string;
  chain?: string;
  district?: string;
  type?: string;
}

export interface PriceReport {
  _id: string;
  productId: string;
  storeId: PriceReportStore;
  price: number;
  status: string;
  confirmations: number;
  isOnSale: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: 'product-detail.page.html',
  styleUrls: ['product-detail.page.scss'],
  standalone: false,
})
export class ProductDetailPage implements OnInit, OnDestroy {
  product: Product | null = null;
  reports: PriceReport[] = [];
  isLoadingProduct = true;
  isLoadingPrices = true;
  hasError = false;

  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private api: ApiService,
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

    this.api
      .get<PriceReport[]>(`/price-reports/product/${productId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          // Sort cheapest first
          this.reports = [...reports].sort((a, b) => a.price - b.price);
          this.isLoadingPrices = false;
        },
        error: () => {
          this.reports = [];
          this.isLoadingPrices = false;
        },
      });
  }

  // -------------------------------------------------------------------------
  // Computed helpers used in the template
  // -------------------------------------------------------------------------

  get bestReport(): PriceReport | null {
    return this.reports.length > 0 ? this.reports[0] : null;
  }

  get worstPrice(): number | null {
    return this.reports.length > 0
      ? this.reports[this.reports.length - 1].price
      : null;
  }

  /** Price range: difference between highest and lowest reported price */
  get priceSpread(): number | null {
    if (this.reports.length < 2) return null;
    const diff = (this.worstPrice ?? 0) - (this.bestReport?.price ?? 0);
    return diff > 0.01 ? diff : null;
  }

  /** Effective lowest price: use lowestPriceEver if lower than current best */
  get effectiveLowest(): number | null {
    const reported = this.bestReport?.price ?? null;
    const ever = this.product?.lowestPriceEver ?? null;
    if (reported === null) return ever;
    if (ever === null) return reported;
    return Math.min(reported, ever);
  }

  priceBarWidth(price: number): string {
    if (this.reports.length < 2) return '100%';
    const max = Math.max(...this.reports.map(r => r.price));
    const min = Math.min(...this.reports.map(r => r.price));
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

  /** Color class for a given report row */
  priceClass(report: PriceReport): string {
    if (!this.bestReport) return '';
    if (report._id === this.bestReport._id) return 'price-best';
    if (this.reports.length > 1 && report._id === this.reports[this.reports.length - 1]._id) {
      return 'price-worst';
    }
    return '';
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

  /** Store initial letter for avatar placeholder */
  storeInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  goBack() {
    this.router.navigate(['/tabs/search']);
  }

  navigateToReportPrice() {
    // Future: navigate to report-price page/modal with productId pre-filled
    console.log('Reportar precio para producto:', this.product?._id);
  }
}
