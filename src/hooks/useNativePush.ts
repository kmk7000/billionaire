import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Registers for native push notifications on iOS/Android (Capacitor builds only —
// no-ops in the browser, where notifications are handled separately if at all).
// Saves the device token to users/{uid}.pushToken so a backend can send via FCM/APNs later.
export function useNativePush(user: FirebaseUser | null) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const setup = async () => {
      const permission = await PushNotifications.checkPermissions();
      let status = permission.receive;
      if (status === 'prompt') {
        const requested = await PushNotifications.requestPermissions();
        status = requested.receive;
      }
      if (status !== 'granted' || !isMounted) return;
      await PushNotifications.register();
    };

    const registrationListener = PushNotifications.addListener('registration', async (token) => {
      try {
        await updateDoc(doc(db, 'users', user.uid), { pushToken: token.value });
      } catch (error) {
        console.warn('Failed to save push token:', error);
      }
    });

    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.warn('Push registration error:', error);
    });

    setup();

    return () => {
      isMounted = false;
      registrationListener.then((l) => l.remove());
      registrationErrorListener.then((l) => l.remove());
    };
  }, [user]);
}
