import React from 'react';
import AppBadge from '../common/AppBadge';

const map = {
  Pending: { label: 'Chờ xử lý', color: 'warning' },
  Confirmed: { label: 'Đã xác nhận', color: 'info' },
  Shipping: { label: 'Đang vận chuyển', color: 'info' },
  Shipped: { label: 'Đã giao', color: 'info' },
  Completed: { label: 'Hoàn thành', color: 'success' },
  Cancelled: { label: 'Đã hủy', color: 'error' },
};
export default function OrderStatusBadge({ status }) {
  const selected = map[status] || { label: status || 'Không rõ', color: 'default' };
  return <AppBadge label={selected.label} color={selected.color} />;
}
