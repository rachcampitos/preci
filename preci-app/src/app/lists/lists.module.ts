import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListsPage } from './lists.page';
import { ListDetailPage } from './list-detail/list-detail.page';
import { ListsPageRoutingModule } from './lists-routing.module';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ListsPageRoutingModule,
    EmptyStateComponent,
  ],
  declarations: [ListsPage, ListDetailPage],
})
export class ListsPageModule {}
