import { Link } from 'react-router-dom'
import { HSK1_WORDS, HSK1_UNITS } from '../data/hsk1'
import { useProgress } from '../store/ProgressContext'
import { getCardStats, getDueWordIds } from '../lib/srs'
import { FireIcon, BookIcon, CardsIcon, MicIcon, PencilIcon } from '../components/Icons'

export default function HomePage() {
  const { srsState, completedUnits, streak, toneStats } = useProgress()
  const allIds = HSK1_WORDS.map((w) => w.id)
  const stats = getCardStats(allIds, srsState)
  const dueCount = getDueWordIds(allIds, srsState, 999).length
  const toneAccuracy = toneStats.total ? Math.round((toneStats.correct / toneStats.total) * 100) : null
  const unitsDone = completedUnits.length

  return (
    <div className="px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Chào bạn 👋</p>
          <h1 className="text-2xl text-brand-800">Học Tiếng Trung</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1.5 text-gold-600">
          <FireIcon width={18} height={18} />
          <span className="text-sm">{streak.count} ngày</span>
        </div>
      </header>

      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">Tiến độ từ vựng HSK1</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-xl text-brand-700">
            {stats.learned}/{stats.total} từ
          </p>
          <p className="text-sm text-gray-500">{unitsDone}/{HSK1_UNITS.length} bài hoàn thành</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-50">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${Math.min(100, (stats.learned / stats.total) * 100)}%` }}
          />
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <Link to="/on-tap" className="rounded-2xl bg-brand-700 p-4 text-white shadow-sm">
          <CardsIcon width={22} height={22} />
          <p className="mt-2 text-lg">Ôn tập ngay</p>
          <p className="text-xs text-brand-100">{dueCount} thẻ cần ôn</p>
        </Link>
        <Link to="/bai-hoc" className="rounded-2xl bg-white p-4 shadow-sm">
          <BookIcon width={22} height={22} className="text-brand-700" />
          <p className="mt-2 text-lg text-gray-800">Bài học</p>
          <p className="text-xs text-gray-500">{HSK1_UNITS.length} bài HSK1</p>
        </Link>
        <Link to="/phat-am" className="rounded-2xl bg-white p-4 shadow-sm">
          <MicIcon width={22} height={22} className="text-brand-700" />
          <p className="mt-2 text-lg text-gray-800">Phát âm & thanh điệu</p>
          <p className="text-xs text-gray-500">
            {toneAccuracy === null ? 'Chưa luyện' : `Độ chính xác ${toneAccuracy}%`}
          </p>
        </Link>
        <Link to="/viet-chu" className="rounded-2xl bg-white p-4 shadow-sm">
          <PencilIcon width={22} height={22} className="text-brand-700" />
          <p className="mt-2 text-lg text-gray-800">Viết chữ Hán</p>
          <p className="text-xs text-gray-500">Luyện nét theo thứ tự chuẩn</p>
        </Link>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm text-gray-500">Gợi ý học hiệu quả</p>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• Học bài mới mỗi ngày, sau đó ôn tập bằng flashcard đều đặn.</li>
          <li>• Luyện nghe - nói ngay từ đầu để quen thanh điệu.</li>
          <li>• Viết tay chữ Hán vài lần giúp nhớ mặt chữ lâu hơn.</li>
        </ul>
      </section>
    </div>
  )
}
