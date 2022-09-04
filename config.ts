import dotenv from 'dotenv'

dotenv.config()

interface Config {
  port: number
  database_host: string
  database_port: number
  database_password: string
  subscription_token: string
  controller_token: string
  controller_broadcast_interval: number
  model_token: string
  stat_fetch_interval: number
  stat_keep_history_time: number
  resource_monitor: boolean
  resource_monitor_host: string
  resource_monitor_port: string
  settings_fetch: boolean
  restful: boolean
  restful_port: number
}

let config: Config

// if (process.env.NODE_ENV === 'test') {
//   config = {}
// } else {
config = {
  port: parseInt(process.env.PORT || '6000'),
  database_host: process.env.DATABASE_HOST || '127.0.0.1',
  database_port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT)
    : 6379,
  database_password: process.env.DATABASE_PASSWORD || '',
  subscription_token:
    process.env.SUBSCRIPTION_TOKEN || 'test-subscription-token',
  controller_token: process.env.CONTROLLER_TOKEN || 'test-controller-token',
  controller_broadcast_interval: process.env.CONTROLLER_BROADCAST_INTERVAL
    ? parseInt(process.env.CONTROLLER_BROADCAST_INTERVAL)
    : 30,
  model_token: process.env.MODEL_TOKEN || 'test-model-token',
  stat_fetch_interval: process.env.STAT_FETCH_INTERVAL
    ? parseInt(process.env.STAT_FETCH_INTERVAL)
    : 30,
  stat_keep_history_time: process.env.STAT_KEEP_HISTORY_TIME
    ? parseInt(process.env.STAT_KEEP_HISTORY_TIME)
    : 3600,
  resource_monitor: process.env.RESOURCE_MONITOR === 'on',
  resource_monitor_host: process.env.RESOURCE_MONITOR_HOST || '',
  resource_monitor_port: process.env.RESOURCE_MONITOR_PORT || '',
  settings_fetch: process.env.SETTINGS_FETCH === 'on',
  restful: process.env.RESTFUL === 'on',
  restful_port: parseInt(process.env.RESTFUL_PORT || '9000'),
}
// }

export default config
