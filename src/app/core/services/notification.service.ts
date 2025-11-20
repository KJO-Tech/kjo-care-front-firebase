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
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { getToken, Messaging } from '@angular/fire/messaging';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  type Notification,
  NotificationStatus,
  NotificationType,
} from '../models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private firestore = inject(Firestore);
  private messaging = inject(Messaging);
  private router = inject(Router);

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

  requestPermission(userId: string): Observable<boolean> {
    console.log('🔔 Requesting notification permission for user:', userId);
    console.log(
      '🔑 VAPID Key configured:',
      environment.firebase.vapidKey ? 'Yes' : 'No',
    );
    console.log(
      '🔑 VAPID Key value:',
      environment.firebase.vapidKey?.substring(0, 20) + '...',
    );

    return from(Notification.requestPermission()).pipe(
      tap((permission) => {
        console.log('✅ Permission result:', permission);
      }),
      switchMap((permission) => {
        if (permission === 'granted') {
          console.log('🎉 Permission granted! Attempting to get FCM token...');

          return from(
            getToken(this.messaging, {
              vapidKey: environment.firebase.vapidKey,
            }),
          ).pipe(
            tap((token) => {
              console.log('📱 Token received:', token ? 'Yes' : 'No');
              if (token) {
                console.log('🔐 Token value:', token.substring(0, 30) + '...');
                this.saveToken(token, userId);
                console.log('💾 Token saved to Firestore');
              } else {
                console.error('❌ No token received from Firebase');
              }
            }),
            map(() => true),
            catchError((error) => {
              console.error('❌ Error getting token:', error);
              console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
              });
              return of(false);
            }),
          );
        } else {
          console.warn('⚠️ Permission not granted:', permission);
          return of(false);
        }
      }),
      catchError((error) => {
        console.error('❌ Error requesting permission:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        return of(false);
      }),
    );
  }

  private saveToken(token: string, userId: string) {
    if (!userId) {
      console.error('❌ Cannot save token: userId is missing');
      return;
    }

    console.log('💾 Saving token to Firestore...');
    console.log('   User ID:', userId);
    console.log('   Token (first 30 chars):', token.substring(0, 30) + '...');
    console.log('   Path:', `users/${userId}/deviceTokens/${token}`);

    const tokenRef = doc(
      this.firestore,
      `users/${userId}/deviceTokens/${token}`,
    );

    setDoc(tokenRef, { token, createdAt: Date.now() })
      .then(() => {
        console.log('✅ Token successfully saved to Firestore');
      })
      .catch((error) => {
        console.error('❌ Error saving token to Firestore:', error);
      });
  }

  deleteToken(userId: string): Observable<void> {
    return from(
      getToken(this.messaging, {
        vapidKey: (environment.firebase as any).vapidKey,
      }),
    ).pipe(
      switchMap((token) => {
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

  getRoute(notification: Notification): any[] {
    switch (notification.type) {
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
      case NotificationType.NEW_BLOG_POST:
        return ['/app/community/post', notification.targetId];
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
