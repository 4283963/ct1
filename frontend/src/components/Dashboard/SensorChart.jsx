import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const typeConfig = {
  temperature: { color: '#f97316', label: '温度 (°C)' },
  ph: { color: '#8b5cf6', label: 'pH 值' },
  filter_life: { color: '#0ea5e9', label: '滤材寿命 (%)' },
}

export default function SensorChart({ sensor, history }) {
  const config = typeConfig[sensor.type] || { color: '#64748b', label: '数值' }

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []
    return history.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      value: point.value,
    }))
  }, [history])

  const domain = useMemo(() => {
    if (sensor.type === 'ph') return [6, 8.5]
    if (sensor.type === 'temperature') return [20, 32]
    if (sensor.type === 'filter_life') return [0, 100]
    return ['auto', 'auto']
  }, [sensor.type])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">{sensor.name} - 趋势图</h3>
          <p className="text-sm text-slate-500">{config.label} 最近 {chartData.length} 条记录</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
          <span className="text-slate-600">实时</span>
        </div>
      </div>

      <div className="h-64">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            暂无历史数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                domain={domain}
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [Number(value).toFixed(2), config.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: config.color }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
