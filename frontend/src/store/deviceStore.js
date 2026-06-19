import { create } from 'zustand'

export const useDeviceStore = create((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,

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
      console.error('切换设备状态失败:', error)
      throw error
    }
  },

  setPumpPower: async (deviceId, powerLevel) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/pump/power`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power_level: powerLevel }),
      })
      if (!res.ok) throw new Error('设置水泵功率失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      console.error('设置水泵功率失败:', error)
      throw error
    }
  },

  setHeaterTemperature: async (deviceId, targetTemperature) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/heater/temperature`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_temperature: targetTemperature }),
      })
      if (!res.ok) throw new Error('设置加热棒温度失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      console.error('设置加热棒温度失败:', error)
      throw error
    }
  },

  addFeederSchedule: async (deviceId, time, portion = 1, enabled = true) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, portion, enabled }),
      })
      if (!res.ok) throw new Error('添加喂食计划失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      console.error('添加喂食计划失败:', error)
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
      console.error('切换喂食计划失败:', error)
      throw error
    }
  },

  triggerManualFeed: async (deviceId, portion = 1) => {
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/feeder/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portion }),
      })
      if (!res.ok) throw new Error('手动喂食失败')
      const data = await res.json()
      get().updateDevice(data)
      return data
    } catch (error) {
      console.error('手动喂食失败:', error)
      throw error
    }
  },
}))
