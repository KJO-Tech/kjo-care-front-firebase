import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { UserModalComponent } from './user-modal/user-modal.component';
import { UserTableComponent } from './user-table/user-table.component';

@Component({
  selector: 'app-user',
  templateUrl: './user-page.component.html',
  imports: [
    DialogComponent,
    ModalOpenButtonComponent,
    UserTableComponent,
    UserModalComponent,
  ],
})
export default class UserPageComponent {
  private readonly userService = inject(UserService);
  readonly search = signal<string>('');
  readonly selectedRole = signal<string>('all');
  readonly showDisabled = signal<boolean>(false);
  readonly toastService = inject(ToastService);

  modalCreateButton = viewChild<ElementRef>('modalCreateButton');

  readonly users = rxResource({
    loader: () => {
      return this.userService.getAll();
    },
  });

  readonly filteredUsers = computed(() => {
    const userList = this.users.value() ?? [];
    const searchTerm = this.search().toLowerCase();
    const selectedRole = this.selectedRole();
    const showDisabled = this.showDisabled();

    return userList
      .filter((user) => {
        if (!showDisabled && !user.enabled) return false;

        if (selectedRole !== 'all') {
          if (user.role !== selectedRole) return false;
        }

        if (searchTerm) {
          const fullName = user.fullName?.toLowerCase() || '';
          const email = user.email?.toLowerCase() || '';
          return fullName.includes(searchTerm) || email.includes(searchTerm);
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  });

  readonly userStats = computed(() => {
    const allUsers = this.users.value() ?? [];
    return {
      total: allUsers.length,
      enabled: allUsers.filter((u) => u.enabled).length,
      disabled: allUsers.filter((u) => !u.enabled).length,
      admins: allUsers.filter((u) => u.role === 'admin').length,
      users: allUsers.filter((u) => u.role === 'user').length,
    };
  });

  readonly selectedUser = this.userService.selectedUser;

  deleteUser(): void {
    const user = this.selectedUser();
    if (!user?.id) return;

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.users.reload();
        this.userService.clearSelectedUser();
      },
    });
  }

  restoreUser(userId: string): void {
    this.userService.restore(userId).subscribe({
      next: () => this.users.reload(),
    });
  }

  toggleUserStatus(userId: string): void {
    const currentUsers = this.users.value() ?? [];
    const userIndex = currentUsers.findIndex((u) => u.id === userId);

    if (userIndex === -1) return;

    const currentUser = currentUsers[userIndex];
    const newStatus = !currentUser.enabled;

    const optimisticUsers = [...currentUsers];
    optimisticUsers[userIndex] = { ...currentUser, enabled: newStatus };
    this.users.set(optimisticUsers);

    this.userService.toggleUserStatus(userId).subscribe({
      next: (updatedUser) => {
        const users = this.users.value() ?? [];
        const finalUsers = users.map((user) =>
          user.id === userId ? updatedUser : user,
        );
        this.users.set(finalUsers);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        const revertedUsers = [...currentUsers];
        revertedUsers[userIndex] = currentUser;
        this.users.set(revertedUsers);

        this.toastService.addToast({
          message: 'Error al cambiar el estado del usuario',
          type: 'error',
          duration: 3000,
        });
      },
    });
  }

  updateSearch(term: string): void {
    this.search.set(term);
  }

  updateRoleFilter(role: string): void {
    this.selectedRole.set(role);
    this.users.reload();
  }

  toggleShowDisabled(): void {
    this.showDisabled.update((current) => !current);
  }

  reload(): void {
    this.users.reload();
  }
}
