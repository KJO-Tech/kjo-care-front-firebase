import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import {
  UserResponse
} from '../../../core/interfaces/user-http.interface';
import { UserService } from '../../../core/services/user.service';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';

@Component({
  selector: 'user-table',
  imports: [ModalOpenButtonComponent, DatePipe],
  templateUrl: './user-table.component.html',
})
export class UserTableComponent {
  readonly userService = inject(UserService);

  readonly users = input.required<UserResponse[]>();

  readonly userToggled = output<string>();
  readonly userRestored = output<string>();

  toggleUserStatus(userId: string): void {
    this.userToggled.emit(userId);
  }

  restoreUser(userId: string): void {
    this.userRestored.emit(userId);
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  }
}
