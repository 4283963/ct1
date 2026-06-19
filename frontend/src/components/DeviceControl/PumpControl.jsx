import { useState, useEffect, useRef, useCallback } from 'react'
import { useDeviceStore } from '../../store/deviceStore'
import { useDebouncedValue } from '../../hooks/useDebounce'

export default function PumpControl({ device }) {
  const [localPower, setLocalPower] = useState(device.power_level ?? 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const abortControllerRef = useRef(null)

  const toggleDevice = useDeviceStore(state => state.toggleDevice)
  const setPumpPower = useDeviceStore(state => state.setPumpPower)
  const optimisticUpdate = useDeviceStore(state => state.optimisticUpdate)

  const isOn = device.status === 'on'
  const storePower = device.power_level ?? 0
  const debouncedPower = useDebouncedValue(localPower, 300)

  useEffect(() => {
    setLocalPower(device.power_level ?? 0)
  }, [device.device_id, device.power_level])

  const submitPower = useCallback(async (power) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSubmitting(true)
    try {
      optimisticUpdate(device.device_id, { power_level: power })
      await setPumpPower(device.device_id, power, { signal: controller.signal })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err)
        setLocalPower(storePower)
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSubmitting(false)
        abortControllerRef.current = null
      }
    }
  }, [device.device_id, storePower, setPumpPower, optimisticUpdate])

  useEffect(() => {
    if (!isOn) return
    if (debouncedPower === storePower) return
    submitPower(debouncedPower)
  }, [debouncedPower, isOn, storePower, submitPower])

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10)
    setLocalPower(value)
  }

  const handleToggle = async () => {
    try {
      await toggleDevice(device.device_id)
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
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
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
          <span className="text-sm font-bold text-sky-600">
            {localPower}%
            {isSubmitting && (
              <span className="ml-2 text-xs font-normal text-slate-400">保存中...</span>
            )}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localPower}
          onChange={handleSliderChange}
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
