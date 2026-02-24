import { Component, OnDestroy, ViewEncapsulation, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ViewDidEnter, ViewDidLeave, Platform } from '@ionic/angular';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductsService, Product } from '../core/services/products.service';

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
})
export class ScanPage implements OnDestroy, ViewDidEnter, ViewDidLeave {
  searchQuery = '';
  isNative = false;
  isSearching = false;
  notFound = false;
  isScanning = false;
  cameraReady = false;
  scanError = '';
  recentScans: { barcode: string; name: string }[] = [];

  private html5Qrcode: Html5Qrcode | null = null;
  private scanLock = false; // Prevenir multiples detecciones

  constructor(
    private router: Router,
    private platform: Platform,
    private productsService: ProductsService,
    private zone: NgZone,
  ) {
    this.isNative = this.platform.is('capacitor');
    this.loadRecentScans();
  }

  // Auto-iniciar camara al entrar al tab
  ionViewDidEnter() {
    if (!this.isScanning && !this.isSearching) {
      this.startScan();
    }
  }

  // Auto-detener al salir del tab
  ionViewDidLeave() {
    this.stopWebScanner();
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
    this.scanLock = false;
    this.cameraReady = false;

    try {
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

      // Iniciar la camara — isScanning se activa DESPUES de que la camara esta lista
      await this.html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 80 },
          disableFlip: false,
          aspectRatio: 1.333,
        },
        (decodedText) => {
          if (this.scanLock) return;
          this.scanLock = true;
          this.zone.run(() => {
            this.stopWebScanner();
            this.lookupBarcode(decodedText);
          });
        },
        () => {},
      );

      // Camara inicio exitosamente
      this.isScanning = true;

      // iOS Safari: forzar playsinline en el video
      this.patchVideoElement();

      // Intentar activar autofocus continuo
      this.enableContinuousAutofocus();

    } catch (err: any) {
      this.isScanning = false;
      const msg = err?.toString() || '';
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        this.scanError = 'Permiso de camara denegado. Habilita el acceso en los ajustes del navegador.';
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
        this.scanError = 'No se encontro una camara en este dispositivo.';
      } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
        this.scanError = 'La camara esta siendo usada por otra aplicacion.';
      } else if (msg.includes('OverconstrainedError')) {
        // Reintentar sin constraint de facingMode (algunos iOS fallan con environment)
        await this.startWebScanFallback();
      } else {
        this.scanError = 'No se pudo acceder a la camara. Intenta recargar la pagina.';
      }
    }
  }

  // Fallback para dispositivos que no soportan facingMode: environment
  private async startWebScanFallback() {
    try {
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

      const devices = await Html5Qrcode.getCameras();
      if (!devices.length) {
        this.scanError = 'No se encontro una camara en este dispositivo.';
        return;
      }

      // Usar la ultima camara (generalmente la trasera)
      const cameraId = devices[devices.length - 1].id;

      await this.html5Qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 260, height: 80 },
          disableFlip: false,
        },
        (decodedText) => {
          if (this.scanLock) return;
          this.scanLock = true;
          this.zone.run(() => {
            this.stopWebScanner();
            this.lookupBarcode(decodedText);
          });
        },
        () => {},
      );

      this.isScanning = true;
      this.patchVideoElement();
      this.enableContinuousAutofocus();
    } catch {
      this.scanError = 'No se pudo acceder a la camara. Intenta recargar la pagina.';
    }
  }

  private patchVideoElement() {
    setTimeout(() => {
      const video = document.querySelector('#scanner-reader video') as HTMLVideoElement;
      if (video) {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.style.objectFit = 'cover';
        this.cameraReady = true;
      }
    }, 300);
  }

  private async stopWebScanner() {
    if (this.html5Qrcode) {
      try {
        const state = this.html5Qrcode.getState();
        if (state === 2) {
          await this.html5Qrcode.stop();
        }
      } catch {}
      this.html5Qrcode = null;
    }
    this.isScanning = false;
    this.cameraReady = false;
    this.scanLock = false;
  }

  private async enableContinuousAutofocus() {
    try {
      await new Promise(r => setTimeout(r, 600));
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
    } catch {}
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
