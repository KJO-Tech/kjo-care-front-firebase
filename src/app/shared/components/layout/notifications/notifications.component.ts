import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  NotificationStatus,
  NotificationType,
} from '../../../../core/models/notification';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'navbar-notifications',
  templateUrl: './notifications.component.html',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  notifications = this.notificationService.notifications;
  NotificationStatus = NotificationStatus;
  NotificationType = NotificationType;

  constructor() {
    effect(() => {
      const user = this.authService.userData();
      if (user) {
        this.notificationService.listenToNotifications(user.uid);
      }
    });
  }

  private _permissionRequested = signal(
    localStorage.getItem('fcm_permission_requested') === 'true',
  );

  showPermissionRequest = computed(() => {
    if (typeof window === 'undefined' || !('Notification' in window))
      return false;
    if (Notification.permission !== 'default') return false;
    return !this._permissionRequested();
  });

  hasUnread = computed(() =>
    this.notifications().some((n) => n.status === NotificationStatus.NEW),
  );

  markAllAsRead() {
    const user = this.authService.userData();
    if (user) {
      this.notificationService.markAllAsRead(user.uid).subscribe();
    }
  }

  handleNotificationClick(notification: any) {
    const user = this.authService.userData();
    if (user) {
      this.notificationService.handleNotificationClick(notification, user.uid);
    }
  }

  enableNotifications() {
    const user = this.authService.userData();
    if (user) {
      this.notificationService
        .requestPermission(user.uid)
        .subscribe((granted) => {
          localStorage.setItem('fcm_permission_requested', 'true');
          this._permissionRequested.set(true);
        });
    }
  }
}
