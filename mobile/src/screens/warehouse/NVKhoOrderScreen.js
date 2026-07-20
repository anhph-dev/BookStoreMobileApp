import React from 'react';
import StaffOrderList from '../../components/order/StaffOrderList';

export default function NVKhoOrderScreen() {
  return (
    <StaffOrderList
      role="NVKho"
      title="Xử lý đơn kho"
      filters={[['Confirmed', 'Chờ lấy hàng'], ['Shipping', 'Đang xử lý'], ['Shipped', 'Đã bàn giao']]}
      initialStatus="Confirmed"
      showAddress
    />
  );
}
