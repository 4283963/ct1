import { useEffect, useRef, useState } from 'react'
import { useSensorStore } from '../store/sensorStore'
import { useDeviceStore } from '../store/deviceStore'

export function useWebSocket() {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const updateSensorsBulk = useSensorStore(state => state.updateSensorsBulk)
  const setSensors = useSensorStore(state => state.setSensors)
  const updateDevicesBulk = useDeviceStore(state => state.updateDevicesBulk)
  const setDevices = useDeviceStore(state => state.setDevices)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/realtime`

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)

          if (data.type === 'initial_state') {
            if (data.sensors?.length) {
              setSensors(data.sensors)
            }
            if (data.devices?.length) {
              setDevices(data.devices)
            }
          } else if (data.type === 'realtime_update') {
            if (data.sensors?.length) {
              updateSensorsBulk(data.sensors)
            }
            if (data.devices?.length) {
              updateDevicesBulk(data.devices)
            }
          }
        } catch (e) {
          console.error('解析 WebSocket 消息失败:', e)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setTimeout(connect, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        ws.close()
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [updateSensorsBulk, setSensors, updateDevicesBulk, setDevices])

  return { isConnected, lastMessage }
}
