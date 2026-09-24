function base(props) {
  return { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', width: 24, height: 24, ...props }
}

export function HomeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function BookIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5" />
      <path d="M4 5.5v15A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  )
}

export function CardsIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="7" width="13" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
    </svg>
  )
}

export function MicIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4M8 22h8" />
    </svg>
  )
}

export function PencilIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="m12 20 9-9 -3-3 -9 9-1 4z" />
      <path d="M15 5 19 9" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

export function FireIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 2s-6 6-6 11a6 6 0 0 0 12 0c0-2-1-3-1-3s0 2-2 2c-1.5 0-2-1.5-1-3 1-1.5 1-3-1-3 0 0 1 2-1 6-1 0-2-1-2-2 0-2 2-5 2-5Z" />
    </svg>
  )
}

export function VolumeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  )
}

export function ArrowLeftIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}
