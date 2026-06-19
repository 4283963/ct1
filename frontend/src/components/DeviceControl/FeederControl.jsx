import { useState } from 'react'
import { useDeviceStore } from '../../store/deviceStore'

export default function FeederControl({ device }) {
  const [loading, setLoading] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('08:00')
  const [schedulePortion, setSchedulePortion] = useState(1)

  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const addFeederSchedule = useDeviceStore(state => state.addFeederSchedule)
  const removeFeederSchedule = useDeviceStore(state => state.removeFeederSchedule)
  const toggleFeederSchedule = useDeviceStore(state => state.toggleFeederSchedule)
  const triggerManualFeed = useDeviceStore(state => state.triggerManualFeed)

  const isOn = device.status === 'on'
  const schedules = device.schedules || []
  const foodRemaining = device.food_remaining ?? 0
  const lastFeed = device.last_feed

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleDevice(device.device_id)
    } finally {
      setLoading(false)
    }
  }

  const handleManualFeed = async () => {
    setFeedLoading(true)
    try {
      await triggerManualFeed(device.device_id, 1)
    } finally {
      setTimeout(() => setFeedLoading(false), 1500)
    }
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault()
    try {
      await addFeederSchedule(device.device_id, scheduleTime, schedulePortion, true)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{device.name}</h3>
            <p className="text-sm text-slate-500">自动定时喂食</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 ${
            isOn ? 'bg-amber-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={handleManualFeed}
          disabled={!isOn || feedLoading}
          className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {feedLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              喂食中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              立即喂食 1 份
            </>
          )}
        </button>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">剩余饲料</span>
          <span className="text-sm font-bold text-amber-600">{foodRemaining.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-amber-500 transition-all"
            style={{ width: `${foodRemaining}%` }}
          />
        </div>
        {lastFeed && (
          <p className="text-xs text-slate-400 mt-2">
            上次喂食: {new Date(lastFeed).toLocaleString('zh-CN')}
          </p>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">喂食计划</h4>
        {schedules.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">暂无计划</p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-mono text-slate-700">{s.time}</span>
                  <span className="text-slate-500">x{s.portion} 份</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFeederSchedule(device.device_id, s.id)}
                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                    title={s.enabled ? '禁用' : '启用'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.enabled
                        ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      } />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeFeederSchedule(device.device_id, s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleAddSchedule} className="flex gap-2">
        <input
          type="time"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          disabled={!isOn}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
        <select
          value={schedulePortion}
          onChange={(e) => setSchedulePortion(parseInt(e.target.value, 10))}
          disabled={!isOn}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        >
          <option value={1}>1份</option>
          <option value={2}>2份</option>
          <option value={3}>3份</option>
        </select>
        <button
          type="submit"
          disabled={!isOn}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          添加
        </button>
      </form>
    </div>
  )
}
