import { Component, inject, input, output } from '@angular/core';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { UserService } from '../../../core/services/user.service';
import { DatePipe } from '@angular/common';
import { UserRequest, UserResponse } from '../../../core/interfaces/user-http.interface';

@Component({
  selector: 'user-table',
  imports: [ModalOpenButtonComponent, DatePipe],
  templateUrl: './user-table.component.html'
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
}
