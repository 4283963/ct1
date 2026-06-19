import { create } from 'zustand'

export const useSensorStore = create((set, get) => ({
  sensors: [],
  history: {},
  isLoading: false,
  error: null,

  setSensors: (sensors) => set({ sensors }),

  updateSensor: (sensorData) => set((state) => {
    const existingIndex = state.sensors.findIndex(s => s.sensor_id === sensorData.sensor_id)
    let newSensors
    if (existingIndex >= 0) {
      newSensors = [...state.sensors]
      newSensors[existingIndex] = { ...newSensors[existingIndex], ...sensorData }
    } else {
      newSensors = [...state.sensors, sensorData]
    }

    const newHistory = { ...state.history }
    if (sensorData.current) {
      const prev = newHistory[sensorData.sensor_id] || []
      const updated = [...prev, {
        value: sensorData.current.value,
        timestamp: sensorData.current.timestamp,
      }]
      newHistory[sensorData.sensor_id] = updated.slice(-120)
    }

    return { sensors: newSensors, history: newHistory }
  }),

  updateSensorsBulk: (sensorList) => set((state) => {
    const sensorMap = new Map(state.sensors.map(s => [s.sensor_id, s]))
    const newHistory = { ...state.history }

    sensorList.forEach(sensorData => {
      const existing = sensorMap.get(sensorData.sensor_id)
      sensorMap.set(sensorData.sensor_id, existing ? { ...existing, ...sensorData } : sensorData)

      if (sensorData.current) {
        const prev = newHistory[sensorData.sensor_id] || []
        prev.push({
          value: sensorData.current.value,
          timestamp: sensorData.current.timestamp,
        })
        newHistory[sensorData.sensor_id] = prev.slice(-120)
      }
    })

    return {
      sensors: Array.from(sensorMap.values()),
      history: newHistory,
    }
  }),

  setHistory: (sensorId, history) => set((state) => ({
    history: { ...state.history, [sensorId]: history },
  })),

  fetchSensors: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/v1/sensors')
      if (!res.ok) throw new Error('获取传感器数据失败')
      const data = await res.json()
      set({ sensors: data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchSensorHistory: async (sensorId, limit = 60) => {
    try {
      const res = await fetch(`/api/v1/sensors/${sensorId}/history?limit=${limit}`)
      if (!res.ok) throw new Error('获取历史数据失败')
      const data = await res.json()
      get().setHistory(sensorId, data.history)
    } catch (error) {
      console.error('获取历史数据失败:', error)
    }
  },
}))
