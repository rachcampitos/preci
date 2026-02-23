import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: false,
})
export class ScanPage {
  scannedBarcode: string | null = null;
  searchQuery = '';
  flashActive = false;
  cameraAvailable = true;
  recentScans: string[] = [];

  constructor(private router: Router) {}

  async startScan() {
    // TODO: Integrar @capacitor-mlkit/barcode-scanning
    console.log('Scanner placeholder - en browser usamos busqueda manual');
  }

  toggleFlash() {
    this.flashActive = !this.flashActive;
    // TODO: Capacitor torch toggle
  }

  manualSearch() {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/tabs/search'], {
      queryParams: { q: this.searchQuery },
    });
  }

  onRecentScan(barcode: string) {
    // TODO: Navegar a resultado de barcode
    console.log('Re-scan:', barcode);
  }
}
