import { useEffect, useMemo, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { HSK1_WORDS } from '../data/hsk1'
import { useProgress } from '../store/ProgressContext'
import { CheckIcon } from '../components/Icons'

function extractChars(words) {
  const seen = new Set()
  const list = []
  for (const w of words) {
    for (const ch of w.hanzi) {
      if (/[一-鿿]/.test(ch) && !seen.has(ch)) {
        seen.add(ch)
        list.push(ch)
      }
    }
  }
  return list
}

const ALL_CHARS = extractChars(HSK1_WORDS)

export default function WritingPage() {
  const { writingStats, recordWritingPractice } = useProgress()
  const [selected, setSelected] = useState(ALL_CHARS[0])
  const [quizResult, setQuizResult] = useState(null)
  const targetRef = useRef(null)
  const writerRef = useRef(null)

  useEffect(() => {
    if (!targetRef.current) return
    targetRef.current.innerHTML = ''
    setQuizResult(null)
    writerRef.current = HanziWriter.create(targetRef.current, selected, {
      width: 260,
      height: 260,
      padding: 12,
      showOutline: true,
      strokeColor: '#991b1b',
      outlineColor: '#fecaca',
      highlightColor: '#f59e0b',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200
    })
    return () => {
      writerRef.current = null
    }
  }, [selected])

  function showAnimation() {
    writerRef.current?.animateCharacter()
  }

  function startQuiz() {
    setQuizResult(null)
    writerRef.current?.quiz({
      onComplete: (summary) => {
        recordWritingPractice(selected)
        const mistakes = summary?.totalMistakes ?? 0
        setQuizResult(mistakes === 0 ? 'perfect' : `Xong! Sai ${mistakes} lần`)
      }
    })
  }

  const practicedCount = writingStats.practiced.length

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-800">Viết chữ Hán</h1>
        <span className="text-sm text-gray-500">
          Đã luyện {practicedCount}/{ALL_CHARS.length}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div ref={targetRef} className="hanzi-target bg-white" style={{ width: 260, height: 260 }} />
        <p className="mt-2 text-sm text-gray-500">
          {HSK1_WORDS.find((w) => w.hanzi.includes(selected))?.meaning}
        </p>

        {quizResult && (
          <p className="mt-2 flex items-center gap-1 text-brand-600">
            <CheckIcon width={18} height={18} />
            {quizResult === 'perfect' ? 'Hoàn hảo, không sai nét nào!' : quizResult}
          </p>
        )}

        <div className="mt-4 flex w-full gap-2">
          <button onClick={showAnimation} className="flex-1 rounded-xl border border-brand-300 py-2.5 text-brand-700">
            Xem thứ tự nét
          </button>
          <button onClick={startQuiz} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-white">
            Tự viết thử
          </button>
        </div>
      </div>

      <p className="mb-2 mt-6 text-sm text-gray-500">Chọn chữ khác:</p>
      <div className="grid grid-cols-8 gap-2">
        {ALL_CHARS.map((ch) => {
          const done = writingStats.practiced.includes(ch)
          return (
            <button
              key={ch}
              onClick={() => setSelected(ch)}
              className={`relative rounded-lg py-2 text-lg ${
                selected === ch ? 'bg-brand-700 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {ch}
              {done && selected !== ch && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
