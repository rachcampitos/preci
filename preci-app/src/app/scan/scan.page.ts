import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductsService, Product } from '../core/services/products.service';

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
})
export class ScanPage implements OnDestroy {
  searchQuery = '';
  isNative = false;
  isSearching = false;
  notFound = false;
  isScanning = false;
  scanError = '';
  recentScans: { barcode: string; name: string }[] = [];

  private html5Qrcode: Html5Qrcode | null = null;

  constructor(
    private router: Router,
    private platform: Platform,
    private productsService: ProductsService,
  ) {
    this.isNative = this.platform.is('capacitor');
    this.loadRecentScans();
  }

  ngOnDestroy() {
    this.stopWebScanner();
  }

  async startScan() {
    if (this.isNative) {
      await this.startNativeScan();
    } else {
      await this.startWebScan();
    }
  }

  async stopScan() {
    await this.stopWebScanner();
  }

  // ── Web Scanner (html5-qrcode) ──────────────────────────────

  private async startWebScan() {
    this.scanError = '';
    this.notFound = false;

    try {
      // Formatos de barcode usados en supermercados Peru
      this.html5Qrcode = new Html5Qrcode('scanner-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      this.isScanning = true;

      await this.html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 80 },
          disableFlip: false,
        },
        (decodedText) => {
          // Barcode detectado — detener y buscar
          this.stopWebScanner();
          this.lookupBarcode(decodedText);
        },
        () => {
          // Escaneando...
        },
      );

      // Activar autofocus continuo en la camara
      this.enableContinuousAutofocus();
    } catch (err: any) {
      this.isScanning = false;
      if (err?.toString().includes('Permission')) {
        this.scanError = 'Permiso de camara denegado. Habilita el acceso en los ajustes del navegador.';
      } else {
        this.scanError = 'No se pudo acceder a la camara.';
      }
    }
  }

  private async stopWebScanner() {
    if (this.html5Qrcode) {
      try {
        const state = this.html5Qrcode.getState();
        if (state === 2) { // SCANNING
          await this.html5Qrcode.stop();
        }
      } catch {}
      this.html5Qrcode = null;
    }
    this.isScanning = false;
  }

  private async enableContinuousAutofocus() {
    try {
      // Esperar a que el video se renderice
      await new Promise(r => setTimeout(r, 500));
      const video = document.querySelector('#scanner-reader video') as HTMLVideoElement;
      if (!video?.srcObject) return;

      const track = (video.srcObject as MediaStream).getVideoTracks()[0];
      if (!track) return;

      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.focusMode?.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as any],
        });
      }
    } catch {
      // Algunos navegadores no soportan focusMode — fail silently
    }
  }

  // ── Native Scanner (Capacitor MLKit) ────────────────────────

  private async startNativeScan() {
    try {
      const mod = await import(/* webpackIgnore: true */ '@capacitor-mlkit/barcode-scanning' as string);
      const BarcodeScanner = mod.BarcodeScanner;
      const granted = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

      if (!granted.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      }

      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        this.lookupBarcode(barcodes[0].rawValue);
      }
    } catch (err) {
      console.error('Native scan error:', err);
    }
  }

  // ── Busqueda ────────────────────────────────────────────────

  manualSearch() {
    const query = this.searchQuery.trim();
    if (!query) return;

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
