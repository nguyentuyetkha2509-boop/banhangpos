import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'
import { loadSrsState, saveSrsState, nextSchedule } from '../lib/srs'

const ProgressContext = createContext(null)

const DAY_MS = 24 * 60 * 60 * 1000

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadStreak() {
  return loadJSON('streak', { count: 0, lastDay: null })
}

export function ProgressProvider({ children }) {
  const [srsState, setSrsState] = useState(() => loadSrsState())
  const [completedUnits, setCompletedUnits] = useState(() => loadJSON('completedUnits', []))
  const [streak, setStreak] = useState(() => loadStreak())
  const [toneStats, setToneStats] = useState(() => loadJSON('toneStats', { correct: 0, total: 0 }))
  const [writingStats, setWritingStats] = useState(() => loadJSON('writingStats', { practiced: [] }))

  useEffect(() => saveSrsState(srsState), [srsState])
  useEffect(() => saveJSON('completedUnits', completedUnits), [completedUnits])
  useEffect(() => saveJSON('streak', streak), [streak])
  useEffect(() => saveJSON('toneStats', toneStats), [toneStats])
  useEffect(() => saveJSON('writingStats', writingStats), [writingStats])

  function touchStreak() {
    setStreak((prev) => {
      const today = todayKey()
      if (prev.lastDay === today) return prev
      const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)
      const count = prev.lastDay === yesterday ? prev.count + 1 : 1
      return { count, lastDay: today }
    })
  }

  function rateCard(wordId, rating) {
    touchStreak()
    setSrsState((prev) => ({
      ...prev,
      [wordId]: nextSchedule(prev[wordId], rating)
    }))
  }

  function markUnitComplete(unitId) {
    touchStreak()
    setCompletedUnits((prev) => (prev.includes(unitId) ? prev : [...prev, unitId]))
  }

  function recordToneAnswer(correct) {
    setToneStats((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }))
  }

  function recordWritingPractice(wordId) {
    touchStreak()
    setWritingStats((prev) =>
      prev.practiced.includes(wordId) ? prev : { practiced: [...prev.practiced, wordId] }
    )
  }

  const value = useMemo(
    () => ({
      srsState,
      completedUnits,
      streak,
      toneStats,
      writingStats,
      rateCard,
      markUnitComplete,
      recordToneAnswer,
      recordWritingPractice
    }),
    [srsState, completedUnits, streak, toneStats, writingStats]
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress phai dung ben trong ProgressProvider')
  return ctx
}
