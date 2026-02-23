import { Component } from '@angular/core';

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: false,
})
export class ScanPage {
  scannedBarcode: string | null = null;

  async startScan() {
    // TODO: Integrar @capacitor-mlkit/barcode-scanning
    console.log('Scanner placeholder');
  }
}
