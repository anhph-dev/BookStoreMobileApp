import React from 'react';
import { useSelector } from 'react-redux';
import { firstName } from '../../utils/formatters';
import StaffOrderList from '../../components/order/StaffOrderList';

export default function SaleOrderListScreen() {
  const user = useSelector((state) => state.auth.user);
  return (
    <StaffOrderList
      role="Sale"
      title="Đơn cần xác nhận"
      subtitle={`Nhân viên: ${firstName(user?.fullName)}`}
      filters={[['', 'Tất cả'], ['Pending', 'Chờ xử lý'], ['Confirmed', 'Đã xác nhận']]}
      createOrder
    />
  );
}
