import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  Notification,
  NOTIFICATION_TYPE_ICON,
  NotificationType,
} from '../../../../core/models/notification';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  imports: [NgClass],
})
export class ToastComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  notificationService = inject(NotificationService);

  userId = computed(() => this.authService.userData()?.uid || '');

  NotificationType = NotificationType;
  notificationIcons = NOTIFICATION_TYPE_ICON;

  handleNotificationClick(notification: Notification) {
    this.notificationService.handleNotificationClick(
      notification,
      this.userId(),
    );
  }
}
