import { Timestamp } from '@angular/fire/firestore';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  MOOD_REMINDER = 'MOOD_REMINDER',
  ACTIVITY_REMINDER = 'ACTIVITY_REMINDER',
  SYSTEM = 'SYSTEM',
  NEW_BLOG_POST = 'NEW_BLOG_POST',
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
