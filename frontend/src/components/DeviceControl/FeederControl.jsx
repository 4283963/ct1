import { useState } from 'react'
import { useDeviceStore } from '../../store/deviceStore'
import FeederScheduleModal from './FeederScheduleModal'

export default function FeederControl({ device }) {
  const [feedLoading, setFeedLoading] = useState(false)
  const [manualGrams, setManualGrams] = useState(2.0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const addFeederSchedule = useDeviceStore(state => state.addFeederSchedule)
  const updateFeederSchedule = useDeviceStore(state => state.updateFeederSchedule)
  const removeFeederSchedule = useDeviceStore(state => state.removeFeederSchedule)
  const toggleFeederSchedule = useDeviceStore(state => state.toggleFeederSchedule)
  const triggerManualFeed = useDeviceStore(state => state.triggerManualFeed)

  const isOn = device.status === 'on'
  const schedules = device.schedules || []
  const foodRemaining = device.food_remaining ?? 0
  const lastFeed = device.last_feed

  const handleToggle = async () => {
    try {
      await toggleDevice(device.device_id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleManualFeed = async () => {
    setFeedLoading(true)
    try {
      await triggerManualFeed(device.device_id, manualGrams)
    } finally {
      setTimeout(() => setFeedLoading(false), 1500)
    }
  }

  const handleOpenCreate = () => {
    setEditingSchedule(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule)
    setModalOpen(true)
  }

  const handleSubmitSchedule = async (payload) => {
    try {
      if (editingSchedule) {
        await updateFeederSchedule(device.device_id, editingSchedule.id, payload)
      } else {
        await addFeederSchedule(device.device_id, payload)
      }
      setModalOpen(false)
      setEditingSchedule(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
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
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
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
          <h4 className="text-sm font-semibold text-slate-700 mb-2">立即喂食</h4>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setManualGrams(Math.max(0.5, manualGrams - 0.5))}
                disabled={!isOn}
                className="px-3 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={manualGrams}
                onChange={(e) => setManualGrams(parseFloat(e.target.value) || 0)}
                disabled={!isOn}
                className="flex-1 text-center py-2 font-mono font-semibold text-slate-800 focus:outline-none disabled:opacity-40"
              />
              <button
                type="button"
                onClick={() => setManualGrams(Math.min(50, manualGrams + 0.5))}
                disabled={!isOn}
                className="px-3 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                +
              </button>
              <span className="px-2 text-sm text-slate-500">克</span>
            </div>
            <button
              onClick={handleManualFeed}
              disabled={!isOn || feedLoading}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {feedLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {feedLoading ? '喂食中' : '喂食'}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700">
              喂食计划
              <span className="ml-1 text-xs text-slate-400 font-normal">({schedules.length})</span>
            </h4>
            <button
              onClick={handleOpenCreate}
              disabled={!isOn}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建计划
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
              暂无喂食计划，点击上方"新建计划"添加
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    s.enabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-lg font-semibold ${s.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                        {s.time}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.enabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {s.grams}g
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {s.weekdays_label || formatWeekdays(s.weekdays)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeederSchedule(device.device_id, s.id)}
                      className={`p-1.5 rounded-md hover:bg-white transition-colors ${
                        s.enabled ? 'text-slate-400 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-500'
                      }`}
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
                      onClick={() => handleOpenEdit(s)}
                      disabled={!isOn}
                      className="p-1.5 rounded-md hover:bg-white text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-40"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFeederSchedule(device.device_id, s.id)}
                      disabled={!isOn}
                      className="p-1.5 rounded-md hover:bg-white text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-40"
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
      </div>

      <FeederScheduleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSchedule(null) }}
        onSubmit={handleSubmitSchedule}
        initialData={editingSchedule}
      />
    </>
  )
}

function formatWeekdays(weekdays) {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  if (!Array.isArray(weekdays) || weekdays.length === 0) return '未设置'
  if (weekdays.length === 7) return '每天'
  if (weekdays.length === 5 && [0,1,2,3,4].every(d => weekdays.includes(d))) return '工作日'
  if (weekdays.length === 2 && [5,6].every(d => weekdays.includes(d))) return '周末'
  return weekdays.sort().map(d => labels[d]).join('、')
}
