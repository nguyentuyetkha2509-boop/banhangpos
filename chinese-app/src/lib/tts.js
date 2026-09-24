// Phat am tu tieng Trung bang Web Speech API (SpeechSynthesis) - khong can file audio.
let cachedVoice = null

function pickChineseVoice() {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis?.getVoices?.() || []
  cachedVoice =
    voices.find((v) => v.lang === 'zh-CN') ||
    voices.find((v) => v.lang?.startsWith('zh')) ||
    null
  return cachedVoice
}

// Voice list co the load bat dong bo lan dau tren mot so trinh duyet.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
  }
}

export function speakChinese(text, { rate = 0.85 } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  utter.rate = rate
  const voice = pickChineseVoice()
  if (voice) utter.voice = voice
  window.speechSynthesis.speak(utter)
  return true
}

export function isTtsSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}
