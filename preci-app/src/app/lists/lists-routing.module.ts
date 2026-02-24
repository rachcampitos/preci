import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListsPage } from './lists.page';
import { ListDetailPage } from './list-detail/list-detail.page';

const routes: Routes = [
  { path: '', component: ListsPage },
  { path: ':id', component: ListDetailPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListsPageRoutingModule {}
