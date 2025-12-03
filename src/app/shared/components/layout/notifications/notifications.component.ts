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
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'navbar-notifications',
  templateUrl: './notifications.component.html',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  private titleService = inject(Title);

  notifications = this.notificationService.notifications;
  NotificationStatus = NotificationStatus;
  NotificationType = NotificationType;

  constructor() {
    effect(() => {
      const user = this.authService.userData();
      if (user) {
        this.notificationService.listenToNotifications(user.uid);
        this.notificationService.setupForegroundListener();
      }
    });

    // Update page title with unread count
    effect(() => {
      const count = this.unreadCount();
      const currentTitle = this.titleService.getTitle();

      // Remove existing count if present
      const titleWithoutCount = currentTitle.replace(/^\(\d+\)\s*/, '');

      // Add new count if there are unread notifications
      if (count > 0) {
        this.titleService.setTitle(`(${count}) ${titleWithoutCount}`);
      } else {
        this.titleService.setTitle(titleWithoutCount);
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

  unreadCount = computed(
    () =>
      this.notifications().filter((n) => n.status === NotificationStatus.NEW)
        .length,
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
