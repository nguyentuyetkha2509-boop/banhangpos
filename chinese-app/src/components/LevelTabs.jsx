import { LEVELS } from '../data/levels'

export default function LevelTabs({ value, onChange }) {
  return (
    <div className="mb-4 flex gap-2">
      {LEVELS.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(level.id)}
          className={`flex-1 rounded-full py-1.5 text-sm ${
            value === level.id ? 'bg-brand-700 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}
