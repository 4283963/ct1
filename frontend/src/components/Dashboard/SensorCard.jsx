const statusColors = {
  normal: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: '正常',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    label: '警告',
  },
  critical: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
    label: '严重',
  },
}

const typeIcons = {
  temperature: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ph: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  filter_life: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
}

const typeColor = {
  temperature: 'text-orange-500',
  ph: 'text-violet-500',
  filter_life: 'text-sky-500',
}

export default function SensorCard({ sensor }) {
  const status = statusColors[sensor.status] || statusColors.normal
  const icon = typeIcons[sensor.type]
  const colorClass = typeColor[sensor.type] || 'text-slate-500'

  const value = sensor.current?.value ?? 0
  const unit = sensor.current?.unit ?? ''
  const timestamp = sensor.current?.timestamp ? new Date(sensor.current.timestamp).toLocaleTimeString('zh-CN') : '--'

  let progressPercent = 0
  if (sensor.type === 'filter_life') {
    progressPercent = value
  } else if (sensor.min_value !== undefined && sensor.max_value !== undefined) {
    progressPercent = ((value - sensor.min_value) / (sensor.max_value - sensor.min_value)) * 100
  }
  progressPercent = Math.max(0, Math.min(100, progressPercent))

  return (
    <div className={`rounded-xl border ${status.border} ${status.bg} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${colorClass}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-2 ${status.text} text-sm font-medium`}>
          <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
          {status.label}
        </div>
      </div>

      <h3 className="text-slate-700 font-semibold text-lg mb-1">{sensor.name}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-900">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        <span className="text-slate-500 text-sm">{unit}</span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            sensor.status === 'critical'
              ? 'bg-rose-500'
              : sensor.status === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>ID: {sensor.sensor_id}</span>
        <span>更新于 {timestamp}</span>
      </div>
    </div>
  )
}
