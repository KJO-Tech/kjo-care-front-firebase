import { Timestamp } from '@angular/fire/firestore';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  MOOD_REMINDER = 'MOOD_REMINDER',
  ACTIVITY_REMINDER = 'ACTIVITY_REMINDER',
  SYSTEM = 'SYSTEM',
  NEW_BLOG_POST = 'NEW_BLOG_POST',
  BLOG_APPROVED = 'BLOG_APPROVED',
  BLOG_REJECTED = 'BLOG_REJECTED',
  UNKNOWN = 'UNKNOWN',
}

export enum NotificationStatus {
  NEW = 'NEW',
  READ = 'READ',
}

export interface Notification {
  id: string;
  type: NotificationType;
  args: string[];
  timestamp: Timestamp;
  status: NotificationStatus;
  targetRoute: string;
  targetId?: string | null;
}

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  // Social & Blog Icons
  [NotificationType.LIKE]: 'favorite',
  [NotificationType.COMMENT]: 'comment',
  [NotificationType.NEW_BLOG_POST]: 'article',
  [NotificationType.BLOG_APPROVED]: 'check_circle',
  [NotificationType.BLOG_REJECTED]: 'cancel',
  // [NotificationType.BLOG_REJECTED]: 'unpublished',
  // Health & System Icons
  [NotificationType.SYSTEM]: 'info',
  [NotificationType.MOOD_REMINDER]: 'sentiment_very_dissatisfied',
  [NotificationType.ACTIVITY_REMINDER]: 'fitness_center',
  [NotificationType.UNKNOWN]: 'info',
};
