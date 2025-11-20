import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, Location, NgClass } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../../../core/models/notification';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  imports: [NgClass, DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class NotificationsPageComponent {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  NotificationType = NotificationType;

  notificationTypes = [
    { type: NotificationType.LIKE, message: 'Likes' },
    { type: NotificationType.COMMENT, message: 'Comentarios' },
    { type: NotificationType.NEW_BLOG_POST, message: 'Nuevos Posts' },
    { type: NotificationType.MOOD_REMINDER, message: 'Estados de ánimo' },
    { type: NotificationType.ACTIVITY_REMINDER, message: 'Actividad' },
  ];

  allNotifications = this.notificationService.notifications;
  selectedFilter = signal<NotificationType | 'all'>('all');

  filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const notifications = this.allNotifications();

    if (filter === 'all') {
      return notifications;
    }
    return notifications.filter((n) => n.type === filter);
  });

  unreadCount = computed(
    () =>
      this.allNotifications().filter((n) => n.status === NotificationStatus.NEW)
        .length,
  );

  handleNotificationClick(notification: Notification) {
    const user = this.authService.userData();
    if (user) {
      this.notificationService.handleNotificationClick(notification, user.uid);
    }
  }

  markAllAsRead() {
    const user = this.authService.userData();
    if (user) {
      this.notificationService.markAllAsRead(user.uid).subscribe();
    }
  }

  onFilterChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedFilter.set(selectElement.value as NotificationType | 'all');
  }

  goBack() {
    this.location.back();
  }
}
