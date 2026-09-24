import { useMemo, useRef, useState } from 'react'
import { HSK1_WORDS } from '../data/hsk1'
import { useProgress } from '../store/ProgressContext'
import { speakChinese, isTtsSupported } from '../lib/tts'
import { VolumeIcon, MicIcon } from '../components/Icons'

const TONE_LABELS = {
  1: { mark: 'ˉ', name: 'Thanh 1 (ngang)' },
  2: { mark: 'ˊ', name: 'Thanh 2 (lên)' },
  3: { mark: 'ˇ', name: 'Thanh 3 (xuống rồi lên)' },
  4: { mark: 'ˋ', name: 'Thanh 4 (xuống mạnh)' }
}

const SINGLE_TONE_WORDS = HSK1_WORDS.filter((w) => w.tones.length === 1 && w.tones[0] !== 0)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickToneQuestion() {
  const word = SINGLE_TONE_WORDS[Math.floor(Math.random() * SINGLE_TONE_WORDS.length)]
  return word
}

function ToneQuiz() {
  const { recordToneAnswer, toneStats } = useProgress()
  const [word, setWord] = useState(pickToneQuestion)
  const [feedback, setFeedback] = useState(null)

  function playCurrent() {
    speakChinese(word.hanzi)
  }

  function answer(tone) {
    if (feedback) return
    const correct = tone === word.tones[0]
    recordToneAnswer(correct)
    setFeedback({ correct, tone })
    setTimeout(() => {
      setFeedback(null)
      setWord(pickToneQuestion())
    }, 900)
  }

  const accuracy = toneStats.total ? Math.round((toneStats.correct / toneStats.total) * 100) : null

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        Nghe rồi chọn đúng thanh điệu của chữ. {accuracy !== null && `Độ chính xác: ${accuracy}%`}
      </p>
      <button
        onClick={playCurrent}
        className="flex w-full flex-col items-center justify-center rounded-3xl bg-white py-10 shadow-sm"
      >
        <p className="text-6xl text-gray-800">{word.hanzi}</p>
        <span className="mt-4 flex items-center gap-1 text-brand-600">
          <VolumeIcon /> Nghe lại
        </span>
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((tone) => {
          const isChosen = feedback?.tone === tone
          const isRight = tone === word.tones[0]
          const showResult = feedback && (isChosen || isRight)
          return (
            <button
              key={tone}
              onClick={() => answer(tone)}
              className={`rounded-2xl border p-4 text-center ${
                showResult
                  ? isRight
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className="text-3xl text-brand-700">{TONE_LABELS[tone].mark}</p>
              <p className="mt-1 text-xs text-gray-500">{TONE_LABELS[tone].name}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ListenBrowse() {
  const [items] = useState(() => shuffle(HSK1_WORDS).slice(0, 30))
  return (
    <div className="space-y-2">
      {items.map((word) => (
        <button
          key={word.id}
          onClick={() => speakChinese(word.hanzi)}
          className="flex w-full items-center justify-between rounded-xl bg-white p-3 shadow-sm"
        >
          <div className="text-left">
            <p className="text-xl text-gray-800">{word.hanzi}</p>
            <p className="text-sm text-brand-600">{word.pinyin}</p>
          </div>
          <VolumeIcon className="text-brand-500" />
        </button>
      ))}
    </div>
  )
}

function RecordCompare() {
  const [word, setWord] = useState(() => HSK1_WORDS[Math.floor(Math.random() * HSK1_WORDS.length)])
  const [status, setStatus] = useState('idle') // idle | recording | recorded | error
  const [audioUrl, setAudioUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
        setStatus('recorded')
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setStatus('recording')
    } catch {
      setStatus('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function nextWord() {
    setWord(HSK1_WORDS[Math.floor(Math.random() * HSK1_WORDS.length)])
    setAudioUrl(null)
    setStatus('idle')
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">Nghe mẫu, ghi âm giọng bạn rồi nghe lại để so sánh.</p>
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="text-5xl text-gray-800">{word.hanzi}</p>
        <p className="mt-1 text-brand-600">{word.pinyin}</p>
        <p className="text-sm text-gray-500">{word.meaning}</p>
        <button
          onClick={() => speakChinese(word.hanzi)}
          className="mx-auto mt-3 flex items-center gap-1 text-brand-600"
        >
          <VolumeIcon width={20} height={20} /> Nghe mẫu
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        {status !== 'recording' ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-white"
          >
            <MicIcon width={20} height={20} /> Bắt đầu ghi âm
          </button>
        ) : (
          <button onClick={stopRecording} className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-white">
            <MicIcon width={20} height={20} /> Dừng ghi âm
          </button>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500">Không dùng được micro (cần cấp quyền hoặc HTTPS).</p>
        )}
        {audioUrl && (
          <div className="flex w-full items-center gap-2">
            <audio className="flex-1" controls src={audioUrl} />
          </div>
        )}
        <button onClick={nextWord} className="text-sm text-gray-500 underline">
          Từ khác
        </button>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'listen', label: 'Nghe từ' },
  { key: 'tone', label: 'Luyện thanh điệu' },
  { key: 'record', label: 'Ghi âm so sánh' }
]

export default function PronunciationPage() {
  const [tab, setTab] = useState('listen')
  const ttsOk = useMemo(() => isTtsSupported(), [])

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-1 text-2xl text-brand-800">Phát âm & thanh điệu</h1>
      {!ttsOk && (
        <p className="mb-3 text-sm text-red-500">Trình duyệt không hỗ trợ đọc giọng tiếng Trung.</p>
      )}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
              tab === t.key ? 'bg-brand-700 text-white' : 'bg-white text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'listen' && <ListenBrowse />}
      {tab === 'tone' && <ToneQuiz />}
      {tab === 'record' && <RecordCompare />}
    </div>
  )
}
