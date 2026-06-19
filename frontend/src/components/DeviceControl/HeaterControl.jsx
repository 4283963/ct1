import { useState } from 'react'
import { useDeviceStore } from '../../store/deviceStore'

export default function HeaterControl({ device }) {
  const [loading, setLoading] = useState(false)
  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const setHeaterTemperature = useDeviceStore(state => state.setHeaterTemperature)

  const isOn = device.status === 'on'
  const targetTemp = device.target_temperature ?? 26
  const currentTemp = device.current_temperature
  const minTemp = device.min_temp ?? 20
  const maxTemp = device.max_temp ?? 32

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleDevice(device.device_id)
    } finally {
      setLoading(false)
    }
  }

  const handleTempChange = async (delta) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp + delta))
    if (newTemp === targetTemp) return
    try {
      await setHeaterTemperature(device.device_id, newTemp)
    } catch (err) {
      console.error(err)
    }
  }

  const tempDiff = currentTemp !== undefined && currentTemp !== null
    ? (targetTemp - currentTemp).toFixed(1)
    : null
  const isHeating = isOn && tempDiff !== null && parseFloat(tempDiff) > 0.1

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isHeating ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{device.name}</h3>
            <p className="text-sm text-slate-500">
              {isHeating ? '加热中...' : isOn ? '恒温保持' : '已关闭'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 ${
            isOn ? 'bg-orange-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-center mb-4">
        <button
          onClick={() => handleTempChange(-0.5)}
          disabled={!isOn || targetTemp <= minTemp}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold text-slate-600 transition-colors"
        >
          −
        </button>
        <div className="mx-6 text-center">
          <div className="text-5xl font-bold text-slate-800">
            {targetTemp.toFixed(1)}
            <span className="text-2xl text-slate-400 ml-1">°C</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            当前: {currentTemp !== undefined && currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : '--'}
          </div>
        </div>
        <button
          onClick={() => handleTempChange(0.5)}
          disabled={!isOn || targetTemp >= maxTemp}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold text-slate-600 transition-colors"
        >
          +
        </button>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-orange-400 transition-all duration-500"
          style={{ width: `${((targetTemp - minTemp) / (maxTemp - minTemp)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{minTemp}°C</span>
        <span>{maxTemp}°C</span>
      </div>
    </div>
  )
}
