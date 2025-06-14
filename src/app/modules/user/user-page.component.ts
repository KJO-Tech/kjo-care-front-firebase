import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ModalOpenButtonComponent } from '../../shared/components/modal-open-button/modal-open-button.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../../core/services/user.service';
import { UserTableComponent } from './user-table/user-table.component';
import { UserModalComponent } from './user-modal/user-modal.component';
import { UserRequest, UserResponse } from '../../core/interfaces/user-http.interface';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user',
  templateUrl: './user-page.component.html',
  imports: [
    DialogComponent,
    ModalOpenButtonComponent,
    UserTableComponent,
    UserModalComponent
  ]
})
export default class UserPageComponent {

  private readonly userService = inject(UserService);
  readonly search = signal<string>("")
  readonly selectedRole = signal<string>("all")
  readonly showDisabled = signal<boolean>(false)
  readonly toastService = inject(ToastService);

  modalCreateButton = viewChild<ElementRef>("modalCreateButton")




  readonly users = rxResource({
    loader: () => {
      // const role = this.selectedRole()
      // const showDisabled = this.showDisabled();

      // if (role !== 'all') {
      //   return this.userService.getUsersByRole(role)
      // }
      return this.userService.getAll()

    }
  });

  readonly filteredUsers = computed(() => {
    const userList = this.users.value() ?? [];
    const searchTerm = this.search().toLowerCase();
    const showDisabled = this.showDisabled();

    return userList
      .filter(user => {
        if (!showDisabled && !user.enabled) return false;

        if (searchTerm) {
          const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
          const email = user.email.toLowerCase();
          return fullName.includes(searchTerm) || email.includes(searchTerm);
        }

        return true;
      })
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp);
  });
  readonly userStats = computed(() => {
    const allUsers = this.users.value() ?? [];
    return {
      total: allUsers.length,
      enabled: allUsers.filter(u => u.enabled).length,
      disabled: allUsers.filter(u => !u.enabled).length,
      admins: allUsers.filter(u => u.roles.includes('admin')).length,
      users: allUsers.filter(u => u.roles.includes('user')).length
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
      }
    });
  }
  restoreUser(userId: string): void {
    this.userService.restore(userId).subscribe({
      next: () => this.users.reload()
    });
  }

  toggleUserStatus(userId: string): void {
    this.userService.toggleUserStatus(userId).subscribe({
      next: () => this.users.reload()
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
    this.showDisabled.update(current => !current);
  }

  reload(): void {
    this.users.reload();
  }
}
