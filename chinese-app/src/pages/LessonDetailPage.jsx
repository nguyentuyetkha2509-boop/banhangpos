import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLevel, ALL_WORDS } from '../data/levels'
import { useProgress } from '../store/ProgressContext'
import { speakChinese } from '../lib/tts'
import { ArrowLeftIcon, VolumeIcon, CheckIcon } from '../components/Icons'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuiz(unitWords, levelWords) {
  return unitWords.map((word) => {
    const pool = levelWords.length > 4 ? levelWords : ALL_WORDS
    const others = shuffle(pool.filter((w) => w.id !== word.id)).slice(0, 3)
    const options = shuffle([word, ...others])
    return { word, options }
  })
}

export default function LessonDetailPage() {
  const { levelId, unitId } = useParams()
  const navigate = useNavigate()
  const level = getLevel(levelId)
  const unit = level?.units.find((u) => u.id === Number(unitId))
  const { markUnitComplete } = useProgress()
  const [phase, setPhase] = useState('study') // study | quiz | done
  const quiz = useMemo(() => (unit ? buildQuiz(unit.words, level.words) : []), [unit, level])
  const [quizIndex, setQuizIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selected, setSelected] = useState(null)

  if (!level || !unit) {
    return (
      <div className="px-4 pt-6">
        <p>Không tìm thấy bài học.</p>
        <Link to="/bai-hoc" className="text-brand-600">
          Quay lại danh sách bài học
        </Link>
      </div>
    )
  }

  function chooseAnswer(option) {
    if (selected) return
    setSelected(option)
    const isCorrect = option.id === quiz[quizIndex].word.id
    if (isCorrect) setCorrectCount((c) => c + 1)
    setTimeout(() => {
      setSelected(null)
      if (quizIndex + 1 < quiz.length) {
        setQuizIndex((i) => i + 1)
      } else {
        markUnitComplete(`${levelId}:${unit.id}`)
        setPhase('done')
      }
    }, 700)
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate('/bai-hoc')} className="text-gray-500">
          <ArrowLeftIcon />
        </button>
        <h1 className="text-xl text-brand-800">
          {level.label} · {unit.title}
        </h1>
      </div>

      {phase === 'study' && (
        <>
          <div className="space-y-2">
            {unit.words.map((word) => (
              <button
                key={word.id}
                onClick={() => speakChinese(word.hanzi)}
                className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm"
              >
                <div>
                  <p className="text-2xl text-gray-800">{word.hanzi}</p>
                  <p className="text-sm text-brand-600">{word.pinyin}</p>
                  <p className="text-sm text-gray-500">{word.meaning}</p>
                </div>
                <VolumeIcon className="text-brand-500" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setPhase('quiz')}
            className="mt-5 w-full rounded-2xl bg-brand-700 py-3 text-lg text-white"
          >
            Làm bài kiểm tra
          </button>
        </>
      )}

      {phase === 'quiz' && quiz[quizIndex] && (
        <div>
          <p className="mb-2 text-sm text-gray-500">
            Câu {quizIndex + 1}/{quiz.length}
          </p>
          <div className="mb-6 rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-4xl text-gray-800">{quiz[quizIndex].word.hanzi}</p>
            <p className="mt-1 text-brand-600">{quiz[quizIndex].word.pinyin}</p>
          </div>
          <p className="mb-2 text-sm text-gray-500">Chọn nghĩa đúng:</p>
          <div className="space-y-2">
            {quiz[quizIndex].options.map((opt) => {
              const isChosen = selected?.id === opt.id
              const isRight = opt.id === quiz[quizIndex].word.id
              const showResult = selected && (isChosen || isRight)
              return (
                <button
                  key={opt.id}
                  onClick={() => chooseAnswer(opt)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    showResult
                      ? isRight
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-red-400 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {opt.meaning}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white">
            <CheckIcon width={28} height={28} />
          </span>
          <p className="text-xl text-gray-800">Hoàn thành!</p>
          <p className="mt-1 text-gray-500">
            Đúng {correctCount}/{quiz.length} câu
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/bai-hoc" className="flex-1 rounded-xl border border-brand-200 py-2.5 text-brand-700">
              Danh sách bài
            </Link>
            <Link to="/on-tap" className="flex-1 rounded-xl bg-brand-700 py-2.5 text-white">
              Ôn tập flashcard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
