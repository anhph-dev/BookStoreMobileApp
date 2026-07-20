import React from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
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
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrderScreen from '../screens/admin/AdminOrderScreen';
import CustomerManageScreen from '../screens/admin/CustomerManageScreen';
import CustomerDetailScreen from '../screens/admin/CustomerDetailScreen';
import SaleOrderListScreen from '../screens/sale/SaleOrderListScreen';
import SaleCreateOrderScreen from '../screens/sale/SaleCreateOrderScreen';
import NVKhoOrderScreen from '../screens/warehouse/NVKhoOrderScreen';
import InventoryScreen from '../screens/warehouse/InventoryScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { COLORS } from '../constants/theme';

const Root = createNativeStackNavigator(); const Stack = createNativeStackNavigator(); const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();
const stackOptions = { headerShown: false };
function HomeStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="Home" component={HomeScreen} /><Stack.Screen name="Search" component={SearchScreen} /><Stack.Screen name="ProductDetail" component={ProductDetailScreen} /></Stack.Navigator>; }
function SearchStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="SearchList" component={SearchScreen} /><Stack.Screen name="ProductDetail" component={ProductDetailScreen} /></Stack.Navigator>; }
function OrderStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="OrderHistoryList" component={OrderHistoryScreen} /><Stack.Screen name="OrderDetail" component={OrderDetailScreen} /></Stack.Navigator>; }
function CustomerStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="CustomerManage" component={CustomerManageScreen} /><Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} /></Stack.Navigator>; }
function ProductStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="ProductManageList" component={ProductManageScreen} /><Stack.Screen name="ProductForm" component={ProductFormScreen} /></Stack.Navigator>; }
function SaleStack() { return <Stack.Navigator screenOptions={stackOptions}><Stack.Screen name="SaleOrderList" component={SaleOrderListScreen} /><Stack.Screen name="SaleCreateOrder" component={SaleCreateOrderScreen} /></Stack.Navigator>; }

const roleTabs = {
  Admin: [
    ['Dashboard', AdminDashboardScreen, 'bar-chart', 'Dashboard'], ['AdminOrders', AdminOrderScreen, 'receipt', 'Đơn hàng'],
    ['Customers', CustomerStack, 'people', 'Khách hàng'], ['Products', ProductStack, 'book', 'Sản phẩm'], ['Profile', ProfileScreen, 'person', 'Tài khoản'],
  ],
  Sale: [
    ['SaleOrders', SaleStack, 'storefront', 'Bán hàng'], ['Products', SearchStack, 'book', 'Sản phẩm'], ['Profile', ProfileScreen, 'person', 'Tài khoản'],
  ],
  NVKho: [
    ['Products', ProductStack, 'book', 'Sản phẩm'], ['WarehouseOrders', NVKhoOrderScreen, 'receipt', 'Đơn hàng'],
    ['Inventory', InventoryScreen, 'cube', 'Kho'], ['Profile', ProfileScreen, 'person', 'Tài khoản'],
  ],
};

function MainTabs() {
  const { user, isLoggedIn } = useSelector((s) => s.auth); const totalCount = useSelector((s) => s.cart.totalCount);
  const tabs = roleTabs[user?.role] || [
    ['HomeTab', HomeStack, 'home', 'Trang chủ'], ['SearchTab', SearchStack, 'search', 'Tìm kiếm'], ['CartTab', CartScreen, 'cart', 'Giỏ hàng'],
    ['OrderTab', OrderStack, 'receipt', 'Đơn hàng'], ['ProfileTab', ProfileScreen, 'person', 'Tài khoản'],
  ];
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.gray,
    tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.border, height: 62 },
    tabBarIcon: ({ focused, color }) => { const tab = tabs.find((x) => x[0] === route.name); const icon = `${tab?.[2] || 'ellipse'}${focused ? '' : '-outline'}`; return <View><Ionicons name={icon} size={24} color={color} />
      {route.name === 'CartTab' && totalCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{totalCount > 99 ? '99+' : totalCount}</Text></View>}</View>; },
  })}>
    {tabs.map(([name, component, , title]) => <Tab.Screen key={name} name={name} component={component} options={{ title }}
      listeners={({ navigation }) => ({ tabPress: (event) => { if (!isLoggedIn && ['OrderTab', 'ProfileTab'].includes(name)) { event.preventDefault(); navigation.getParent()?.navigate('Login', { returnTo: name }); } } })} />)}
  </Tab.Navigator>;
}
export default function AppNavigator() {
  return <NavigationContainer ref={navigationRef}><Root.Navigator screenOptions={stackOptions}><Root.Screen name="Main" component={MainTabs} /><Root.Screen name="Login" component={LoginScreen} /><Root.Screen name="Register" component={RegisterScreen} />
    <Root.Screen name="ProductDetail" component={ProductDetailScreen} /><Root.Screen name="Checkout" component={CheckoutScreen} /><Root.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    <Root.Screen name="OrderHistory" component={OrderHistoryScreen} /><Root.Screen name="OrderDetail" component={OrderDetailScreen} /><Root.Screen name="ProductManage" component={ProductManageScreen} /><Root.Screen name="ProductForm" component={ProductFormScreen} />
  </Root.Navigator></NavigationContainer>;
}
const styles = StyleSheet.create({ badge: { position: 'absolute', right: -13, top: -7, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' } });
