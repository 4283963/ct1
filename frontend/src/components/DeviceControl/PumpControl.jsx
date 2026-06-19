import { useState } from 'react'
import { useDeviceStore } from '../../store/deviceStore'

export default function PumpControl({ device }) {
  const [loading, setLoading] = useState(false)
  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const setPumpPower = useDeviceStore(state => state.setPumpPower)

  const isOn = device.status === 'on'
  const power = device.power_level ?? 0

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleDevice(device.device_id)
    } finally {
      setLoading(false)
    }
  }

  const handlePowerChange = async (e) => {
    const value = parseInt(e.target.value, 10)
    try {
      await setPumpPower(device.device_id, value)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{device.name}</h3>
            <p className="text-sm text-slate-500">主循环系统</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 ${
            isOn ? 'bg-sky-500' : 'bg-slate-300'
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">功率</span>
          <span className="text-sm font-bold text-sky-600">{power}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={power}
          onChange={handlePowerChange}
          disabled={!isOn}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">流量</p>
          <p className="font-semibold text-slate-800">
            {device.flow_rate ? `${device.flow_rate} L/h` : '--'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">状态</p>
          <p className={`font-semibold ${isOn ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isOn ? '运行中' : '已关闭'}
          </p>
        </div>
      </div>
    </div>
  )
}
