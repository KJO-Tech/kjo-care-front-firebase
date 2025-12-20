import { computed, inject, Injectable, signal } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { getToken, Messaging, onMessage } from '@angular/fire/messaging';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  type Notification,
  NotificationStatus,
  NotificationType,
} from '../models/notification';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private firestore = inject(Firestore);
  private messaging = inject(Messaging);
  private router = inject(Router);
  private toastService = inject(ToastService);

  private _notifications = signal<Notification[]>([]);

  notifications = computed(() => this._notifications());

  constructor() {}

  listenToNotifications(userId: string) {
    if (!userId) return;

    const notificationsRef = collection(
      this.firestore,
      `users/${userId}/notifications`,
    );
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));

    collectionData(q, { idField: 'id' })
      .pipe(
        map((notifications: any[]) => {
          return notifications.map((n) => ({
            ...n,
            // Ensure timestamp is handled correctly if needed
          })) as Notification[];
        }),
      )
      .subscribe((notifications) => {
        this._notifications.set(notifications);
      });
  }

  setupForegroundListener() {
    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Convert Firebase MessagePayload to our Notification model
      const notification: Notification = {
        id: payload.messageId || Date.now().toString(),
        type:
          (payload.data?.['type'] as NotificationType) ||
          NotificationType.SYSTEM,
        status: NotificationStatus.NEW,
        timestamp: Timestamp.now(),
        args: payload.data?.['args']
          ? JSON.parse(payload.data['args'] as string)
          : [],
        targetRoute:
          (payload.data?.['targetRoute'] as string) || '/app/notifications',
        targetId: (payload.data?.['targetId'] as string) || null,
      };

      // Show toast notification
      this.toastService.addNotification(notification);
    });
  }

  requestPermission(userId: string): Observable<boolean> {
    return from(Notification.requestPermission()).pipe(
      switchMap((permission) => {
        if (permission === 'granted') {
          return from(
            getToken(this.messaging, {
              vapidKey: environment.firebase.vapidKey,
            }),
          ).pipe(
            tap((token) => {
              if (token) {
                this.saveToken(token, userId);
              }
            }),
            map(() => true),
            catchError((error) => {
              console.error('Error getting FCM token:', error);
              return of(false);
            }),
          );
        }
        return of(false);
      }),
      catchError((error) => {
        console.error('Error requesting notification permission:', error);
        return of(false);
      }),
    );
  }

  private saveToken(token: string, userId: string) {
    if (!userId) {
      return;
    }

    const tokenRef = doc(
      this.firestore,
      `users/${userId}/deviceTokens/${token}`,
    );

    setDoc(tokenRef, { token, createdAt: Date.now() }).catch((error) => {
      console.error('Error saving FCM token:', error);
    });
  }

  deleteToken(userId: string): Observable<void> {
    return from(
      getToken(this.messaging, {
        vapidKey: (environment.firebase as any).vapidKey,
      }),
    ).pipe(
      switchMap((token) => {
        localStorage.setItem('fcm_permission_requested', 'false');
        if (token && userId) {
          const tokenRef = doc(
            this.firestore,
            `users/${userId}/deviceTokens/${token}`,
          );
          return from(deleteDoc(tokenRef));
        }
        return of(void 0);
      }),
      catchError(() => of(void 0)),
    );
  }

  markAsRead(id: string, userId: string): Observable<void> {
    if (!userId) return of();

    const notificationRef = doc(
      this.firestore,
      `users/${userId}/notifications/${id}`,
    );
    return from(
      updateDoc(notificationRef, { status: NotificationStatus.READ }),
    );
  }

  markAllAsRead(userId: string): Observable<void> {
    if (!userId) return of();

    const batch = writeBatch(this.firestore);
    const unreadNotifications = this._notifications().filter(
      (n) => n.status === NotificationStatus.NEW,
    );

    unreadNotifications.forEach((n) => {
      const ref = doc(this.firestore, `users/${userId}/notifications/${n.id}`);
      batch.update(ref, { status: NotificationStatus.READ });
    });

    return from(batch.commit());
  }

  sendNotification(
    userId: string,
    notification: Partial<Notification>,
  ): Observable<void> {
    const notificationsRef = collection(
      this.firestore,
      `users/${userId}/notifications`,
    );
    const id = doc(notificationsRef).id;

    const newNotification: Notification = {
      timestamp: Timestamp.now(),
      status: NotificationStatus.NEW,
      args: [],
      targetRoute: 'notifications_screen',
      targetId: null,
      ...notification,
      id,
    } as Notification;

    return from(setDoc(doc(notificationsRef, id), newNotification));
  }

  getRoute(notification: Notification): any[] {
    switch (notification.type) {
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
      case NotificationType.NEW_BLOG_POST:
      case NotificationType.BLOG_APPROVED:
        return ['/app/community/post', notification.targetId];
      case NotificationType.BLOG_REJECTED:
        return ['/app/notifications'];
      case NotificationType.MOOD_REMINDER:
        return ['/app/mood'];
      case NotificationType.ACTIVITY_REMINDER:
        return ['/app/daily-exercise'];
      default:
        return ['/app/notifications'];
    }
  }

  handleNotificationClick(notification: Notification, userId: string) {
    this.markAsRead(notification.id, userId).subscribe();
    const route = this.getRoute(notification);
    this.router.navigate(route);
  }
}
