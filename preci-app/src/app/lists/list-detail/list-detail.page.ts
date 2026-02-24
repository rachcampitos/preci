import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import {
  ShoppingListsService,
  ShoppingList,
  ShoppingListItem,
  StoreTotalEntry,
} from '../../core/services/shopping-lists.service';
import { ProductsService, Product } from '../../core/services/products.service';

@Component({
  selector: 'app-list-detail',
  templateUrl: 'list-detail.page.html',
  styleUrls: ['list-detail.page.scss'],
  standalone: false,
})
export class ListDetailPage implements OnInit {
  list: ShoppingList | null = null;
  isLoading = true;
  showSearch = false;

  // Product search
  searchQuery = '';
  searchResults: Product[] = [];
  isSearching = false;

  // Store totals comparison
  storeTotals: StoreTotalEntry[] = [];
  isLoadingTotals = false;
  showTotals = false;

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private alertController: AlertController,
    private toastController: ToastController,
    private shoppingListsService: ShoppingListsService,
    private productsService: ProductsService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadList(id);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchQuery = '';
      this.searchResults = [];
    }
  }

  onSearchInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    const query = this.searchQuery.trim();
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.searchTimeout = setTimeout(() => {
      this.productsService.search(query, 10).subscribe({
        next: (products) => {
          // Filter out products already in the list
          const existingIds = new Set(
            this.list?.items.map((i) => i.productId._id) || [],
          );
          this.searchResults = products.filter(
            (p) => !existingIds.has(p._id),
          );
          this.isSearching = false;
        },
        error: () => {
          this.searchResults = [];
          this.isSearching = false;
        },
      });
    }, 300);
  }

  addProduct(product: Product) {
    if (!this.list) return;
    this.shoppingListsService.addItem(this.list._id, product._id).subscribe({
      next: () => {
        // Reload list to get populated product data
        this.loadList(this.list!._id);
        this.searchQuery = '';
        this.searchResults = [];
        this.showSearch = false;
        this.resetTotals();
        this.showToast(`${product.name} agregado`);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al agregar';
        this.showToast(msg);
      },
    });
  }

  toggleItem(item: ShoppingListItem) {
    if (!this.list) return;
    this.shoppingListsService
      .toggleItem(this.list._id, item.productId._id)
      .subscribe({
        next: () => {
          item.isChecked = !item.isChecked;
        },
      });
  }

  incrementQuantity(item: ShoppingListItem) {
    if (!this.list || item.quantity >= 99) return;
    const newQty = item.quantity + 1;
    this.shoppingListsService
      .updateItemQuantity(this.list._id, item.productId._id, newQty)
      .subscribe({
        next: () => {
          item.quantity = newQty;
          this.resetTotals();
        },
      });
  }

  decrementQuantity(item: ShoppingListItem) {
    if (!this.list || item.quantity <= 1) return;
    const newQty = item.quantity - 1;
    this.shoppingListsService
      .updateItemQuantity(this.list._id, item.productId._id, newQty)
      .subscribe({
        next: () => {
          item.quantity = newQty;
          this.resetTotals();
        },
      });
  }

  async removeItem(item: ShoppingListItem) {
    if (!this.list) return;
    const alert = await this.alertController.create({
      header: 'Quitar producto',
      message: `Quitar "${item.productId.name}" de la lista?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar',
          role: 'destructive',
          handler: () => {
            this.shoppingListsService
              .removeItem(this.list!._id, item.productId._id)
              .subscribe({
                next: () => {
                  this.list!.items = this.list!.items.filter(
                    (i) => i.productId._id !== item.productId._id,
                  );
                  this.resetTotals();
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  loadStoreTotals() {
    if (!this.list || this.list.items.length === 0) return;
    this.isLoadingTotals = true;
    this.showTotals = true;
    this.shoppingListsService.getStoreTotals(this.list._id).subscribe({
      next: (totals) => {
        this.storeTotals = totals;
        this.isLoadingTotals = false;
      },
      error: () => {
        this.storeTotals = [];
        this.isLoadingTotals = false;
      },
    });
  }

  get uncheckedCount(): number {
    return this.list?.items.filter((i) => !i.isChecked).length || 0;
  }

  get totalItems(): number {
    return this.list?.items.length || 0;
  }

  storeMissingLabel(entry: StoreTotalEntry): string {
    if (entry.missingItems.length === 0) return '';
    const n = entry.missingItems.length;
    return n === 1 ? '1 no disponible' : `${n} no disponibles`;
  }

  private loadList(id: string) {
    this.isLoading = true;
    this.shoppingListsService.getById(id).subscribe({
      next: (list) => {
        this.list = list;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.navCtrl.back();
      },
    });
  }

  private resetTotals() {
    this.showTotals = false;
    this.storeTotals = [];
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'bottom',
      cssClass: 'preci-toast',
    });
    await toast.present();
  }
}
