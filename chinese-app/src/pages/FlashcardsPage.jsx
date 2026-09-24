import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_WORDS, getWordById } from '../data/levels'
import { useProgress } from '../store/ProgressContext'
import { getDueWordIds } from '../lib/srs'
import { speakChinese } from '../lib/tts'
import { VolumeIcon, CheckIcon } from '../components/Icons'

const RATINGS = [
  { value: 0, label: 'Lại', className: 'bg-red-500' },
  { value: 1, label: 'Khó', className: 'bg-orange-400' },
  { value: 2, label: 'Ổn', className: 'bg-brand-500' },
  { value: 3, label: 'Dễ', className: 'bg-emerald-500' }
]

export default function FlashcardsPage() {
  const { srsState, rateCard } = useProgress()
  const allIds = useMemo(() => ALL_WORDS.map((w) => w.id), [])
  const [queue, setQueue] = useState(() => getDueWordIds(allIds, srsState, 20))
  const [reviewed, setReviewed] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const currentId = queue[0]
  const currentWord = currentId ? getWordById(currentId) : null

  function handleRate(rating) {
    rateCard(currentId, rating)
    setReviewed((n) => n + 1)
    setFlipped(false)
    setQueue((q) => q.slice(1))
  }

  if (!currentWord) {
    return (
      <div className="px-4 pt-6">
        <h1 className="mb-4 text-2xl text-brand-800">Ôn tập</h1>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white">
            <CheckIcon width={28} height={28} />
          </span>
          <p className="text-lg text-gray-800">
            {reviewed > 0 ? `Đã ôn xong ${reviewed} thẻ!` : 'Không có thẻ nào cần ôn lúc này.'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Học bài mới hoặc quay lại sau nhé.</p>
          <Link to="/bai-hoc" className="mt-4 inline-block rounded-xl bg-brand-700 px-5 py-2.5 text-white">
            Học bài mới
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-800">Ôn tập</h1>
        <span className="text-sm text-gray-500">Còn {queue.length} thẻ</span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[16rem] w-full flex-col items-center justify-center rounded-3xl bg-white p-6 text-center shadow-sm"
      >
        <p className="text-5xl text-gray-800">{currentWord.hanzi}</p>
        {flipped ? (
          <>
            <p className="mt-3 text-xl text-brand-600">{currentWord.pinyin}</p>
            <p className="mt-1 text-gray-600">{currentWord.meaning}</p>
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-400">Chạm để xem đáp án</p>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation()
          speakChinese(currentWord.hanzi)
        }}
        className="mx-auto mt-3 flex items-center gap-1 text-brand-600"
      >
        <VolumeIcon width={20} height={20} />
        Nghe phát âm
      </button>

      {flipped && (
        <div className="mt-6 grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRate(r.value)}
              className={`rounded-xl py-3 text-sm text-white ${r.className}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
