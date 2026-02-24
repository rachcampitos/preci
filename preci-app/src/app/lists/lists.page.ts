import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ViewWillEnter } from '@ionic/angular';
import {
  ShoppingListsService,
  ShoppingList,
} from '../core/services/shopping-lists.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-lists',
  templateUrl: 'lists.page.html',
  styleUrls: ['lists.page.scss'],
  standalone: false,
})
export class ListsPage implements ViewWillEnter {
  lists: ShoppingList[] = [];
  isLoading = true;
  isLoggedIn = false;

  constructor(
    private shoppingListsService: ShoppingListsService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.loadLists();
    } else {
      this.isLoading = false;
    }
  }

  async createList() {
    const alert = await this.alertController.create({
      header: 'Nueva lista',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ej: Semanal, Cena del viernes...',
          attributes: { maxlength: 50 },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            const name = data.name?.trim();
            if (!name) return false;
            this.shoppingListsService.create(name).subscribe({
              next: (list) => {
                this.lists.unshift(list);
                this.router.navigate(['/tabs/lists', list._id]);
              },
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  openList(list: ShoppingList) {
    this.router.navigate(['/tabs/lists', list._id]);
  }

  async deleteList(list: ShoppingList) {
    const alert = await this.alertController.create({
      header: 'Eliminar lista',
      message: `Eliminar "${list.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.shoppingListsService.delete(list._id).subscribe({
              next: () => {
                this.lists = this.lists.filter((l) => l._id !== list._id);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  goToLogin() {
    this.router.navigateByUrl('/auth/login');
  }

  itemCountLabel(list: ShoppingList): string {
    const count = list.items?.length || 0;
    return count === 1 ? '1 producto' : `${count} productos`;
  }

  private loadLists() {
    this.isLoading = true;
    this.shoppingListsService.getAll().subscribe({
      next: (lists) => {
        this.lists = lists;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
