import { create } from 'zustand'

export const useDeviceStore = create((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,
  _pendingRequests: new Map(),

  setDevices: (devices) => set({ devices }),

  updateDevice: (deviceData) => set((state) => {
    const idx = state.devices.findIndex(d => d.device_id === deviceData.device_id)
    const newDevices = [...state.devices]
    if (idx >= 0) {
      newDevices[idx] = { ...newDevices[idx], ...deviceData }
    } else {
      newDevices.push(deviceData)
    }
    return { devices: newDevices }
  }),

  updateDevicesBulk: (deviceList) => set((state) => {
    const deviceMap = new Map(state.devices.map(d => [d.device_id, d]))
    deviceList.forEach(d => {
      const existing = deviceMap.get(d.device_id)
      deviceMap.set(d.device_id, existing ? { ...existing, ...d } : d)
    })
    return { devices: Array.from(deviceMap.values()) }
  }),

  optimisticUpdate: (deviceId, patch) => set((state) => {
    const idx = state.devices.findIndex(d => d.device_id === deviceId)
    if (idx < 0) return state
    const newDevices = [...state.devices]
    newDevices[idx] = { ...newDevices[idx], ...patch }
    return { devices: newDevices }
  }),

  _abortPendingRequest: (key) => {
    const pending = get()._pendingRequests
    if (pending.has(key)) {
      const controller = pending.get(key)
      controller.abort()
      pending.delete(key)
    }
  },

  _registerPendingRequest: (key, controller) => {
    get()._pendingRequests.set(key, controller)
  },

  _clearPendingRequest: (key) => {
    get()._pendingRequests.delete(key)
  },

  fetchDevices: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/v1/devices')
      if (!res.ok) throw new Error('获取设备列表失败')
      const data = await res.json()
      set({ devices: data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  toggleDevice: async (deviceId) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('切换设备状态失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('切换设备状态失败:', error)
      throw error
    }
  },

  setPumpPower: async (deviceId, powerLevel, options = {}) => {
    const { signal } = options
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/pump/power`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power_level: powerLevel }),
        signal,
      })
      if (!res.ok) throw new Error('设置水泵功率失败')
      const data = await res.json()
      if (!signal?.aborted) {
        get().updateDevice(data)
      }
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('设置水泵功率失败:', error)
      throw error
    }
  },

  setHeaterTemperature: async (deviceId, targetTemperature, options = {}) => {
    const { signal } = options
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/heater/temperature`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_temperature: targetTemperature }),
        signal,
      })
      if (!res.ok) throw new Error('设置加热棒温度失败')
      const data = await res.json()
      if (!signal?.aborted) {
        get().updateDevice(data)
      }
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('设置加热棒温度失败:', error)
      throw error
    }
  },

  addFeederSchedule: async (deviceId, payload) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: payload.time,
          grams: payload.grams ?? 2.0,
          weekdays: payload.weekdays ?? [0, 1, 2, 3, 4, 5, 6],
          enabled: payload.enabled ?? true,
        }),
      })
      if (!res.ok) throw new Error('添加喂食计划失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('添加喂食计划失败:', error)
      throw error
    }
  },

  updateFeederSchedule: async (deviceId, scheduleId, payload) => {
    try {
      const body = {}
      if (payload.time !== undefined) body.time = payload.time
      if (payload.grams !== undefined) body.grams = payload.grams
      if (payload.weekdays !== undefined) body.weekdays = payload.weekdays
      if (payload.enabled !== undefined) body.enabled = payload.enabled
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('更新喂食计划失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('更新喂食计划失败:', error)
      throw error
    }
  },

  removeFeederSchedule: async (deviceId, scheduleId) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/schedules/${scheduleId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('删除喂食计划失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('删除喂食计划失败:', error)
      throw error
    }
  },

  toggleFeederSchedule: async (deviceId, scheduleId) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/schedules/${scheduleId}/toggle`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('切换喂食计划失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('切换喂食计划失败:', error)
      throw error
    }
  },

  triggerManualFeed: async (deviceId, grams = 2.0) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grams }),
      })
      if (!res.ok) throw new Error('手动喂食失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') return null
      console.error('手动喂食失败:', error)
      throw error
    }
  },
}))
