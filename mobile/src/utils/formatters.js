export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

export function firstName(fullName = '') {
  return String(fullName).trim().split(/\s+/).filter(Boolean).slice(-1)[0] || 'bạn';
}

export function formatDateTime(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return date.toLocaleString('vi-VN');
}
