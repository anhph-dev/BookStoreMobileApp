import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import createUserService from './userService';
import { store } from '../store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const userService = createUserService(store);

export async function registerForPushNotifications() {
  // Android emulators that include Google Play Services can obtain an FCM
  // token. iOS simulators still cannot provide the native token used here.
  if (!Device.isDevice && Platform.OS !== 'android') {
    console.log('Push notifications cần thiết bị thật trên nền tảng này');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo BookStore',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5E3C',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  if (finalStatus !== 'granted') {
    console.log('Không được cấp quyền notification');
    return null;
  }

  const tokenData = await Notifications.getDevicePushTokenAsync();
  const fcmToken = String(tokenData.data);
  await userService.updateFcmToken(fcmToken);
  return fcmToken;
}

export async function unregisterPushNotifications() {
  await userService.deleteFcmToken();
}
