import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductDetailPage } from './product-detail.page';
import { ProductDetailPageRoutingModule } from './product-detail-routing.module';
import { ReportPriceModalComponent } from './report-price-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ProductDetailPageRoutingModule,
  ],
  declarations: [ProductDetailPage, ReportPriceModalComponent],
})
export class ProductDetailPageModule {}
