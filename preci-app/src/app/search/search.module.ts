import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchPage } from './search.page';
import { SearchPageRoutingModule } from './search-routing.module';
import { ProductCardComponent } from '../shared/components/product-card/product-card.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    SearchPageRoutingModule,
    ProductCardComponent,
    EmptyStateComponent,
  ],
  declarations: [SearchPage],
})
export class SearchPageModule {}
