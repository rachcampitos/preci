import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ListItemProduct {
  _id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  unit: string;
  averagePrice?: number;
}

export interface ShoppingListItem {
  productId: ListItemProduct;
  quantity: number;
  isChecked: boolean;
}

export interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreTotalEntry {
  storeId: string;
  storeName: string;
  storeType: string;
  storeChain?: string;
  total: number;
  itemCount: number;
  missingItems: string[];
}

@Injectable({ providedIn: 'root' })
export class ShoppingListsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ShoppingList[]> {
    return this.api.get<ShoppingList[]>('/shopping-lists');
  }

  getById(id: string): Observable<ShoppingList> {
    return this.api.get<ShoppingList>(`/shopping-lists/${id}`);
  }

  create(name: string): Observable<ShoppingList> {
    return this.api.post<ShoppingList>('/shopping-lists', { name });
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/shopping-lists/${id}`);
  }

  addItem(listId: string, productId: string, quantity = 1): Observable<ShoppingList> {
    return this.api.post<ShoppingList>(`/shopping-lists/${listId}/items`, {
      productId,
      quantity,
    });
  }

  updateItemQuantity(listId: string, productId: string, quantity: number): Observable<ShoppingList> {
    return this.api.patch<ShoppingList>(
      `/shopping-lists/${listId}/items/${productId}`,
      { quantity },
    );
  }

  removeItem(listId: string, productId: string): Observable<ShoppingList> {
    return this.api.delete<ShoppingList>(
      `/shopping-lists/${listId}/items/${productId}`,
    );
  }

  toggleItem(listId: string, productId: string): Observable<ShoppingList> {
    return this.api.patch<ShoppingList>(
      `/shopping-lists/${listId}/items/${productId}/toggle`,
      {},
    );
  }

  getStoreTotals(listId: string): Observable<StoreTotalEntry[]> {
    return this.api.get<StoreTotalEntry[]>(
      `/shopping-lists/${listId}/store-totals`,
    );
  }
}
