import React from 'react';
import StaffOrderList from '../../components/order/StaffOrderList';

export default function AdminOrderScreen() {
  return (
    <StaffOrderList
      role="Admin"
      title="Quản lý đơn hàng"
      searchable
      filters={[['', 'Tất cả'], ['Pending', 'Chờ xử lý'], ['Shipping', 'Đang giao'], ['Completed', 'Hoàn tất']]}
    />
  );
}
