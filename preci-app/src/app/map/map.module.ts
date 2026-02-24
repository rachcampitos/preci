import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapPage } from './map.page';
import { MapPageRoutingModule } from './map-routing.module';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { SuggestStoreModalComponent } from './suggest-store-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MapPageRoutingModule,
    EmptyStateComponent,
  ],
  declarations: [MapPage, SuggestStoreModalComponent],
})
export class MapPageModule {}
