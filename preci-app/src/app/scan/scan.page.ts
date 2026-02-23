import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { ProductsService, Product } from '../core/services/products.service';

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: false,
})
export class ScanPage {
  searchQuery = '';
  flashActive = false;
  isNative = false;
  isSearching = false;
  notFound = false;
  recentScans: { barcode: string; name: string }[] = [];

  constructor(
    private router: Router,
    private platform: Platform,
    private productsService: ProductsService,
  ) {
    this.isNative = this.platform.is('capacitor');
    this.loadRecentScans();
  }

  async startScan() {
    if (!this.isNative) return;

    try {
      // Dynamic import para evitar error en web (solo se carga en nativo)
      const mod = await import(/* @vite-ignore */ '@capacitor-mlkit/barcode-scanning' as string);
      const BarcodeScanner = mod.BarcodeScanner;
      const granted = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

      if (!granted.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      }

      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        const barcode = barcodes[0].rawValue;
        this.lookupBarcode(barcode);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  }

  toggleFlash() {
    this.flashActive = !this.flashActive;
  }

  manualSearch() {
    const query = this.searchQuery.trim();
    if (!query) return;

    // Si parece un barcode (solo numeros, 8-13 digitos), buscar por barcode
    if (/^\d{8,13}$/.test(query)) {
      this.lookupBarcode(query);
    } else {
      this.router.navigate(['/tabs/search'], {
        queryParams: { q: query },
      });
    }
  }

  onRecentScan(scan: { barcode: string; name: string }) {
    this.lookupBarcode(scan.barcode);
  }

  private lookupBarcode(barcode: string) {
    this.isSearching = true;
    this.notFound = false;

    this.productsService.getByBarcode(barcode).subscribe({
      next: (product: Product) => {
        this.isSearching = false;
        this.saveRecentScan(barcode, product.name);
        this.router.navigate(['/tabs/product', product._id]);
      },
      error: () => {
        this.isSearching = false;
        this.notFound = true;
        this.searchQuery = barcode;
      },
    });
  }

  private saveRecentScan(barcode: string, name: string) {
    this.recentScans = [
      { barcode, name },
      ...this.recentScans.filter(s => s.barcode !== barcode),
    ].slice(0, 5);
    try {
      localStorage.setItem('preci_recent_scans', JSON.stringify(this.recentScans));
    } catch {}
  }

  private loadRecentScans() {
    try {
      const saved = localStorage.getItem('preci_recent_scans');
      if (saved) this.recentScans = JSON.parse(saved);
    } catch {}
  }
}
