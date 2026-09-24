// Spaced repetition don gian kieu SM-2, luu trang thai tung tu trong localStorage.
import { loadJSON, saveJSON } from './storage'

const KEY = 'srs'
const DAY_MS = 24 * 60 * 60 * 1000

// rating: 0 = Lai (quen), 1 = Kho, 2 = On, 3 = De
export function nextSchedule(card, rating) {
  const prev = card || { interval: 0, ease: 2.5, reps: 0 }
  let { interval, ease, reps } = prev

  if (rating === 0) {
    reps = 0
    interval = 0.02 // ~30 phut, xem lai gan nhu ngay
  } else {
    ease = Math.max(1.3, ease + (rating === 3 ? 0.15 : rating === 1 ? -0.2 : 0))
    reps += 1
    if (reps === 1) interval = rating === 1 ? 0.5 : 1
    else if (reps === 2) interval = rating === 1 ? 1 : 3
    else interval = Math.round(interval * ease * (rating === 1 ? 0.7 : 1))
    interval = Math.max(interval, 0.5)
  }

  return {
    interval,
    ease,
    reps,
    due: Date.now() + interval * DAY_MS,
    updatedAt: Date.now()
  }
}

export function loadSrsState() {
  return loadJSON(KEY, {})
}

export function saveSrsState(state) {
  saveJSON(KEY, state)
}

export function getDueWordIds(allWordIds, srsState, limit = 20) {
  const now = Date.now()
  const due = []
  const untouched = []
  for (const id of allWordIds) {
    const card = srsState[id]
    if (!card) untouched.push(id)
    else if (card.due <= now) due.push({ id, due: card.due })
  }
  due.sort((a, b) => a.due - b.due)
  const result = due.map((d) => d.id)
  for (const id of untouched) {
    if (result.length >= limit) break
    result.push(id)
  }
  return result.slice(0, limit)
}

export function getCardStats(allWordIds, srsState) {
  const now = Date.now()
  let learned = 0
  let due = 0
  let newCount = 0
  for (const id of allWordIds) {
    const card = srsState[id]
    if (!card) newCount += 1
    else {
      learned += 1
      if (card.due <= now) due += 1
    }
  }
  return { total: allWordIds.length, learned, due, newCount }
}
