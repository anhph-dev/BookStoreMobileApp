import { useMemo } from 'react';
import { useStore } from 'react-redux';

import createAuthService from '../services/authService';
import createProductService from '../services/productService';
import createOrderService from '../services/orderService';
import createUserService from '../services/userService';
import createPaymentService from '../services/paymentService';

export function useServices() {
  const store = useStore();

  return useMemo(() => ({
    authService: createAuthService(store),
    productService: createProductService(store),
    orderService: createOrderService(store),
    userService: createUserService(store),
    paymentService: createPaymentService(store),
  }), [store]);
}
