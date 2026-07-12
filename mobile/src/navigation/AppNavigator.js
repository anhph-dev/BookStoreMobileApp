import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrderSuccessScreen from '../screens/checkout/OrderSuccessScreen';
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ProductManageScreen from '../screens/admin/ProductManageScreen';
import ProductFormScreen from '../screens/admin/ProductFormScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { COLORS } from '../constants/theme';
import AppButton from '../components/common/AppButton';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </HomeStack.Navigator>
  );
}

function LoginPromptScreen({ navigation, route }) {
  return (
    <View style={styles.guestGate}>
      <Ionicons name="person-circle-outline" size={64} color={COLORS.primary} />
      <Text style={styles.guestTitle}>Đăng nhập để tiếp tục</Text>
      <Text style={styles.guestSubtitle}>Một số tính năng chỉ mở khi bạn có tài khoản.</Text>
      <AppButton label="Đăng nhập" onPress={() => navigation.navigate('Login', { returnTo: route?.name })} fullWidth />
      <AppButton label="Đăng ký" onPress={() => navigation.navigate('Register', { returnTo: route?.name })} variant="outline" fullWidth />
    </View>
  );
}

function MainTabs() {
  const totalCount = useSelector((state) => state.cart.totalCount);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: 'home-outline',
            SearchTab: 'search-outline',
            CartTab: 'cart-outline',
            OrderTab: 'receipt-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Tìm kiếm' }} />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Giỏ hàng',
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
        }}
      />
      <Tab.Screen
        name="OrderTab"
        component={isLoggedIn ? OrderHistoryScreen : LoginPromptScreen}
        options={{ title: 'Đơn hàng' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={isLoggedIn ? ProfileScreen : LoginPromptScreen}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <RootStack.Screen name="Checkout" component={CheckoutScreen} />
        <RootStack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <RootStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <RootStack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <RootStack.Screen name="ProductManage" component={ProductManageScreen} />
        <RootStack.Screen name="ProductForm" component={ProductFormScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  guestGate: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  guestTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: COLORS.dark,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
});
