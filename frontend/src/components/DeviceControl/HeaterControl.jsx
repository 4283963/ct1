import { useState, useEffect, useRef, useCallback } from 'react'
import { useDeviceStore } from '../../store/deviceStore'
import { useDebouncedValue } from '../../hooks/useDebounce'

export default function HeaterControl({ device }) {
  const [localTemp, setLocalTemp] = useState(device.target_temperature ?? 26)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const abortControllerRef = useRef(null)

  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const setHeaterTemperature = useDeviceStore(state => state.setHeaterTemperature)
  const optimisticUpdate = useDeviceStore(state => state.optimisticUpdate)

  const isOn = device.status === 'on'
  const storeTemp = device.target_temperature ?? 26
  const currentTemp = device.current_temperature
  const minTemp = device.min_temp ?? 20
  const maxTemp = device.max_temp ?? 32
  const debouncedTemp = useDebouncedValue(localTemp, 300)

  useEffect(() => {
    setLocalTemp(device.target_temperature ?? 26)
  }, [device.device_id, device.target_temperature])

  const submitTemp = useCallback(async (temp) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSubmitting(true)
    try {
      optimisticUpdate(device.device_id, { target_temperature: temp })
      await setHeaterTemperature(device.device_id, temp, { signal: controller.signal })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err)
        setLocalTemp(storeTemp)
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSubmitting(false)
        abortControllerRef.current = null
      }
    }
  }, [device.device_id, storeTemp, setHeaterTemperature, optimisticUpdate])

  useEffect(() => {
    if (!isOn) return
    if (Math.abs(debouncedTemp - storeTemp) < 0.01) return
    submitTemp(debouncedTemp)
  }, [debouncedTemp, isOn, storeTemp, submitTemp])

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value)
    setLocalTemp(Math.round(value * 10) / 10)
  }

  const handleStep = (delta) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, localTemp + delta))
    setLocalTemp(Math.round(newTemp * 10) / 10)
  }

  const handleToggle = async () => {
    try {
      await toggleDevice(device.device_id)
    } catch (err) {
      console.error(err)
    }
  }

  const tempDiff = currentTemp !== undefined && currentTemp !== null
    ? (storeTemp - currentTemp).toFixed(1)
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
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
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
          onClick={() => handleStep(-0.5)}
          disabled={!isOn || localTemp <= minTemp}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold text-slate-600 transition-colors"
        >
          −
        </button>
        <div className="mx-6 text-center">
          <div className="text-5xl font-bold text-slate-800">
            {localTemp.toFixed(1)}
            <span className="text-2xl text-slate-400 ml-1">°C</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            当前: {currentTemp !== undefined && currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : '--'}
            {isSubmitting && (
              <span className="ml-2 text-amber-500">保存中...</span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleStep(0.5)}
          disabled={!isOn || localTemp >= maxTemp}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold text-slate-600 transition-colors"
        >
          +
        </button>
      </div>

      <div className="mb-3">
        <input
          type="range"
          min={minTemp}
          max={maxTemp}
          step="0.5"
          value={localTemp}
          onChange={handleSliderChange}
          disabled={!isOn}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{minTemp}°C</span>
        <span>{maxTemp}°C</span>
      </div>
    </div>
  )
}
