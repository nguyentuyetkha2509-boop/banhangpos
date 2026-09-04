const PREFIX = 'banhang_pos_'

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage khong kha dung (private mode, het dung luong...) - bo qua
  }
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + '₫'
}
