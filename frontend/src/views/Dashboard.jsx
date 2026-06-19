import { useEffect } from 'react'
import { useSensorStore } from '../store/sensorStore'
import { useDeviceStore } from '../store/deviceStore'
import { useWebSocket } from '../hooks/useWebSocket'
import SensorCard from '../components/Dashboard/SensorCard'
import SensorChart from '../components/Dashboard/SensorChart'
import PumpControl from '../components/DeviceControl/PumpControl'
import HeaterControl from '../components/DeviceControl/HeaterControl'
import FeederControl from '../components/DeviceControl/FeederControl'

export default function Dashboard() {
  const sensors = useSensorStore(state => state.sensors)
  const history = useSensorStore(state => state.history)
  const devices = useDeviceStore(state => state.devices)
  const fetchSensors = useSensorStore(state => state.fetchSensors)
  const fetchDevices = useDeviceStore(state => state.fetchDevices)
  const { isConnected } = useWebSocket()

  useEffect(() => {
    fetchSensors()
    fetchDevices()
  }, [fetchSensors, fetchDevices])

  const pumps = devices.filter(d => d.type === 'pump')
  const heaters = devices.filter(d => d.type === 'heater')
  const feeders = devices.filter(d => d.type === 'feeder')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-aquarium-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aquarium-400 to-aquarium-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">鱼缸远程管理系统</h1>
                <p className="text-xs text-slate-500">循环水生态鱼缸 · IoT 监控平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? '实时连接' : '连接中断'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">传感器监控</h2>
            <span className="text-sm text-slate-500">{sensors.length} 个传感器在线</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map(sensor => (
              <SensorCard key={sensor.sensor_id} sensor={sensor} />
            ))}
          </div>
        </section>

        {sensors.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">实时趋势</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {sensors.map(sensor => (
                <SensorChart
                  key={sensor.sensor_id}
                  sensor={sensor}
                  history={history[sensor.sensor_id] || []}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">设备控制中心</h2>
            <span className="text-sm text-slate-500">{devices.length} 个设备</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pumps.map(device => (
              <PumpControl key={device.device_id} device={device} />
            ))}
            {heaters.map(device => (
              <HeaterControl key={device.device_id} device={device} />
            ))}
            {feeders.map(device => (
              <FeederControl key={device.device_id} device={device} />
            ))}
          </div>
        </section>

        <footer className="mt-12 py-6 text-center text-sm text-slate-400">
          Aquarium IoT Management System · v1.0.0
        </footer>
      </main>
    </div>
  )
}
