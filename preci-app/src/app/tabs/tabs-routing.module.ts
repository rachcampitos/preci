import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'scan',
        loadChildren: () =>
          import('../scan/scan.module').then((m) => m.ScanPageModule),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('../search/search.module').then((m) => m.SearchPageModule),
      },
      {
        path: 'map',
        loadChildren: () =>
          import('../map/map.module').then((m) => m.MapPageModule),
      },
      {
        path: 'lists',
        loadChildren: () =>
          import('../lists/lists.module').then((m) => m.ListsPageModule),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.module').then((m) => m.ProfilePageModule),
      },
      {
        path: 'product/:id',
        loadChildren: () =>
          import('../product-detail/product-detail.module').then(
            (m) => m.ProductDetailPageModule,
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/scan',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/scan',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
