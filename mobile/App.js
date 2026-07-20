import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';

import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import { persistor, store } from './src/store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const openNotification = (notification) => {
      const data = notification?.request?.content?.data;
      if (!navigationRef.isReady()) return;

      if (data?.screen === 'OrderDetail' && data?.orderId) {
        navigationRef.navigate('OrderDetail', { orderId: Number(data.orderId) });
      } else if (data?.screen === 'Home') {
        navigationRef.navigate('Main', { screen: 'HomeTab', params: { screen: 'Home' } });
      }
    };

    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      Toast.show({
        type: 'info',
        text1: notification.request.content.title || 'Thông báo',
        text2: notification.request.content.body || '',
      });
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotification(response.notification);
    });

    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse?.notification) {
      const timeout = setTimeout(() => openNotification(initialResponse.notification), 500);
      return () => {
        clearTimeout(timeout);
        foregroundSub.remove();
        responseSub.remove();
      };
    }

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || ''}>
              <AppNavigator />
              <Toast />
            </StripeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
