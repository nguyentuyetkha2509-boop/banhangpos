import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getLevel } from '../data/levels'
import { useProgress } from '../store/ProgressContext'
import { CheckIcon } from '../components/Icons'
import LevelTabs from '../components/LevelTabs'

export default function LessonsPage() {
  const { completedUnits } = useProgress()
  const [levelId, setLevelId] = useState('hsk1')
  const level = getLevel(levelId)

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-1 text-2xl text-brand-800">Bài học {level.label}</h1>
      <p className="mb-4 text-sm text-gray-500">
        {level.words.length} từ vựng, chia thành {level.units.length} bài, mỗi bài 10 từ.
      </p>

      <LevelTabs value={levelId} onChange={setLevelId} />

      <div className="space-y-3">
        {level.units.map((unit) => {
          const unitKey = `${levelId}:${unit.id}`
          const done = completedUnits.includes(unitKey)
          return (
            <Link
              key={unit.id}
              to={`/bai-hoc/${levelId}/${unit.id}`}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-lg text-gray-800">{unit.title}</p>
                <p className="text-xs text-gray-500">
                  {unit.words[0].hanzi} · {unit.words[unit.words.length - 1].hanzi} và {unit.words.length - 2} từ khác
                </p>
              </div>
              {done ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                  <CheckIcon width={18} height={18} />
                </span>
              ) : (
                <span className="text-xs text-brand-600">Bắt đầu</span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
