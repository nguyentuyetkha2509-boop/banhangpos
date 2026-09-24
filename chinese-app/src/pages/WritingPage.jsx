import { useEffect, useMemo, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { getLevel } from '../data/levels'
import { useProgress } from '../store/ProgressContext'
import { CheckIcon } from '../components/Icons'
import LevelTabs from '../components/LevelTabs'

function extractChars(words) {
  const seen = new Set()
  const list = []
  for (const w of words) {
    for (const ch of w.hanzi) {
      if (/[一-鿿]/.test(ch) && !seen.has(ch)) {
        seen.add(ch)
        list.push({ char: ch, meaning: w.meaning })
      }
    }
  }
  return list
}

export default function WritingPage() {
  const { writingStats, recordWritingPractice } = useProgress()
  const [levelId, setLevelId] = useState('hsk1')
  const level = getLevel(levelId)
  const chars = useMemo(() => extractChars(level.words), [level])
  const [selected, setSelected] = useState(chars[0])
  const [quizResult, setQuizResult] = useState(null)
  const targetRef = useRef(null)
  const writerRef = useRef(null)

  useEffect(() => {
    if (!chars.some((c) => c.char === selected?.char)) {
      setSelected(chars[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chars])

  useEffect(() => {
    if (!targetRef.current || !selected) return
    targetRef.current.innerHTML = ''
    setQuizResult(null)
    writerRef.current = HanziWriter.create(targetRef.current, selected.char, {
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
        recordWritingPractice(selected.char)
        const mistakes = summary?.totalMistakes ?? 0
        setQuizResult(mistakes === 0 ? 'perfect' : `Xong! Sai ${mistakes} lần`)
      }
    })
  }

  const practicedCount = chars.filter((c) => writingStats.practiced.includes(c.char)).length

  if (!selected) return null

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-800">Viết chữ Hán</h1>
        <span className="text-sm text-gray-500">
          Đã luyện {practicedCount}/{chars.length}
        </span>
      </div>

      <LevelTabs value={levelId} onChange={setLevelId} />

      <div className="flex flex-col items-center">
        <div ref={targetRef} className="hanzi-target bg-white" style={{ width: 260, height: 260 }} />
        <p className="mt-2 text-sm text-gray-500">{selected.meaning}</p>

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
        {chars.map(({ char }) => {
          const done = writingStats.practiced.includes(char)
          return (
            <button
              key={char}
              onClick={() => setSelected(chars.find((c) => c.char === char))}
              className={`relative rounded-lg py-2 text-lg ${
                selected.char === char ? 'bg-brand-700 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {char}
              {done && selected.char !== char && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
