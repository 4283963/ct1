import { useState, useEffect } from 'react'

const WEEKDAYS = [
  { value: 0, label: '一' },
  { value: 1, label: '二' },
  { value: 2, label: '三' },
  { value: 3, label: '四' },
  { value: 4, label: '五' },
  { value: 5, label: '六' },
  { value: 6, label: '日' },
]

const GRAM_PRESETS = [0.5, 1, 1.5, 2, 3, 5]

export default function FeederScheduleModal({ isOpen, onClose, onSubmit, initialData }) {
  const [time, setTime] = useState('08:00')
  const [grams, setGrams] = useState(2.0)
  const [weekdays, setWeekdays] = useState([0, 1, 2, 3, 4, 5, 6])
  const [enabled, setEnabled] = useState(true)
  const [customGrams, setCustomGrams] = useState('')

  useEffect(() => {
    if (initialData) {
      setTime(initialData.time || '08:00')
      setGrams(initialData.grams ?? 2.0)
      setWeekdays(Array.isArray(initialData.weekdays) ? [...initialData.weekdays] : [0, 1, 2, 3, 4, 5, 6])
      setEnabled(initialData.enabled !== false)
    } else {
      setTime('08:00')
      setGrams(2.0)
      setWeekdays([0, 1, 2, 3, 4, 5, 6])
      setEnabled(true)
    }
    setCustomGrams('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const toggleWeekday = (value) => {
    setWeekdays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    )
  }

  const selectAllWeekdays = () => setWeekdays([0, 1, 2, 3, 4, 5, 6])
  const selectWeekdays = () => setWeekdays([0, 1, 2, 3, 4])
  const selectWeekends = () => setWeekdays([5, 6])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (weekdays.length === 0) return
    const finalGrams = customGrams ? parseFloat(customGrams) : grams
    if (!finalGrams || finalGrams <= 0) return
    onSubmit({
      time,
      grams: finalGrams,
      weekdays,
      enabled,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {initialData ? '编辑喂食计划' : '新建喂食计划'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">喂食时间</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">重复</label>
            <div className="flex gap-1 mb-2">
              {WEEKDAYS.map((day) => {
                const isActive = weekdays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllWeekdays} className="text-xs text-slate-500 hover:text-amber-600">每天</button>
              <button type="button" onClick={selectWeekdays} className="text-xs text-slate-500 hover:text-amber-600">工作日</button>
              <button type="button" onClick={selectWeekends} className="text-xs text-slate-500 hover:text-amber-600">周末</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">喂食克数</label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {GRAM_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGrams(g); setCustomGrams('') }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    !customGrams && grams === g
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">自定义:</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={customGrams}
                onChange={(e) => setCustomGrams(e.target.value)}
                placeholder="克数"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <span className="text-sm text-slate-500">g</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">启用该计划</p>
              <p className="text-xs text-slate-500">关闭后到点不会喂食</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={weekdays.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? '保存修改' : '创建计划'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
