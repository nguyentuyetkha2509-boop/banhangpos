import React from 'react'

export function CartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 4h2l2.1 11.2a2 2 0 002 1.65h7.4a2 2 0 002-1.65L19 8.2H6.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20.2" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20.2" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function BoxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M4.3 7.2L12 11.2l7.7-4M12 11.2V21"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="12.5" width="3.6" height="7" rx="1.2" fill="currentColor" />
      <rect x="10.2" y="7.5" width="3.6" height="12" rx="1.2" fill="currentColor" />
      <rect x="16.4" y="4" width="3.6" height="15.5" rx="1.2" fill="currentColor" />
    </svg>
  )
}

export function ReceiptIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 3h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M9 8.2h6M9 11.6h6M9 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
