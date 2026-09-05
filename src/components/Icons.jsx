import React from 'react'

const STROKE = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }

export function CartIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M6.5 9h15l-2.3 10.4a2 2 0 0 1-2 1.6h-6.4a2 2 0 0 1-2-1.6L6.5 9z" />
      <circle cx="11.5" cy="23" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="23" r="1.5" fill="currentColor" />
      <path {...STROKE} d="M8.5 9V7a2.5 2.5 0 0 1 2.5-2.5h6A2.5 2.5 0 0 1 19.5 7v2" />
    </svg>
  )
}

export function BoxIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M14 4.2 22.5 8.7v10.6L14 23.8 5.5 19.3V8.7L14 4.2z" />
      <path {...STROKE} d="M5.5 8.7 14 13.2l8.5-4.5M14 13.2v10.6" />
    </svg>
  )
}

export function ChartIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <rect x="6" y="15" width="4" height="8.5" rx="1" fill="currentColor" />
      <rect x="12" y="10" width="4" height="13.5" rx="1" fill="currentColor" />
      <rect x="18" y="5.5" width="4" height="18" rx="1" fill="currentColor" />
    </svg>
  )
}

export function ReceiptIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M7 4h14v16.5l-1.8-1.2-1.8 1.2-1.8-1.2-1.8 1.2-1.8-1.2-1.8 1.2-1.8-1.2-1.8 1.2V4z" />
      <path {...STROKE} d="M9.6 9h8.8M9.6 12.4h8.8M9.6 15.8h5.6" />
    </svg>
  )
}

export function WalletIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <rect {...STROKE} x="4.5" y="7.5" width="19" height="14" rx="3" />
      <rect {...STROKE} x="15.5" y="12.5" width="8" height="6" rx="2" />
      <circle cx="19.5" cy="15.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function RestockIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M5.5 13h4.2l1.6 2.3h5.4l1.6-2.3h4.2V22h-17V13z" />
      <path {...STROKE} d="M14 3.5v7.5M11 8l3 3 3-3" />
    </svg>
  )
}

export function ReturnIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path
        {...STROKE}
        fill="currentColor"
        stroke="none"
        d="M10.7 7.3 5.8 11.6l4.9 4.7v-3.1c4.3 0 7.3 1.7 9.3 5-.3-5.6-3.6-8.9-9.3-9.1V7.3z"
      />
    </svg>
  )
}

export function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} strokeWidth="2" d="M14 7v14M7 14h14" />
    </svg>
  )
}

export function SettingsIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <circle {...STROKE} cx="14" cy="14" r="6" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="12.6"
          y="2.6"
          width="2.8"
          height="4"
          rx="1"
          fill="currentColor"
          transform={`rotate(${deg} 14 14)`}
        />
      ))}
      <circle cx="14" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function ExportIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M8 4h8.5L21 8.3V24H8V4z" />
      <rect x="10.5" y="16" width="2" height="4" rx="0.6" fill="currentColor" />
      <rect x="13.5" y="13.5" width="2" height="6.5" rx="0.6" fill="currentColor" />
      <rect x="16.5" y="15" width="2" height="5" rx="0.6" fill="currentColor" />
    </svg>
  )
}

export function ScanIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M6 10V8.5A1.5 1.5 0 0 1 7.5 7H9.5" />
      <path {...STROKE} d="M22 10V8.5A1.5 1.5 0 0 0 20.5 7H18.5" />
      <path {...STROKE} d="M6 18v1.5A1.5 1.5 0 0 0 7.5 21H9.5" />
      <path {...STROKE} d="M22 18v1.5A1.5 1.5 0 0 1 20.5 21H18.5" />
      <path {...STROKE} d="M9 14h10" />
    </svg>
  )
}

export function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <rect x="6.5" y="7" width="15" height="2.2" rx="1" fill="currentColor" />
      <rect x="11.5" y="4.5" width="5" height="2.2" rx="1" fill="currentColor" />
      <path {...STROKE} d="M8.5 10h11l-1 12.5a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L8.5 10z" />
      <path {...STROKE} d="M11.8 13v7M16.2 13v7" />
    </svg>
  )
}

export function MoneyIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <circle {...STROKE} cx="14" cy="14" r="9" />
      <path {...STROKE} d="M11.5 11.5h5M11.5 14.5h5M15 9.5v9" />
    </svg>
  )
}

export function ImageIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <rect {...STROKE} x="4.5" y="5" width="19" height="18" rx="2.5" />
      <circle cx="10.2" cy="10.5" r="1.8" fill="currentColor" />
      <path {...STROKE} d="M6 18.5l4.5-5 3.5 4 2.5-3 5.5 6.5" />
    </svg>
  )
}

export function PrintIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <path {...STROKE} d="M9 10V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4" />
      <rect {...STROKE} x="6" y="10" width="16" height="9" rx="1.8" />
      <rect {...STROKE} x="9" y="15" width="10" height="7" rx="0.8" />
      <circle cx="18" cy="13.2" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function ShareIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <circle {...STROKE} cx="21" cy="8" r="3" />
      <circle {...STROKE} cx="7" cy="14" r="3" />
      <circle {...STROKE} cx="21" cy="20" r="3" />
      <path {...STROKE} d="M9.6 12.5l8.8-3M9.6 15.5l8.8 3" />
    </svg>
  )
}

export function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <circle {...STROKE} cx="14" cy="14" r="9.5" />
      <path {...STROKE} d="M14 8.5V14l4 2.5" />
    </svg>
  )
}

export function BarcodeIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <rect x="4" y="6" width="1.6" height="16" fill="currentColor" />
      <rect x="7.2" y="6" width="0.8" height="16" fill="currentColor" />
      <rect x="9.6" y="6" width="2" height="16" fill="currentColor" />
      <rect x="13.2" y="6" width="0.8" height="16" fill="currentColor" />
      <rect x="15.2" y="6" width="1.6" height="16" fill="currentColor" />
      <rect x="18" y="6" width="2" height="16" fill="currentColor" />
      <rect x="21.6" y="6" width="0.8" height="16" fill="currentColor" />
      <rect x="23.2" y="6" width="1.6" height="16" fill="currentColor" />
    </svg>
  )
}

export function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 28 28" className={className}>
      <circle {...STROKE} cx="14" cy="10" r="4" />
      <path {...STROKE} d="M6 23c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}
