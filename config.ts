import dotenv from 'dotenv'

dotenv.config()

interface Config {
  database_host: string
  database_port: number
  database_password: string
  subscription_token: string
  synchronization_token: string
  stat_fetch_interval: number
  stat_keep_history_time: number
}

let config: Config

// if (process.env.NODE_ENV === 'test') {
//   config = {}
// } else {
  config = {
    database_host: process.env.DATABASE_HOST || '127.0.0.1',
    database_port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT)
      : 6379,
    database_password: process.env.DATABASE_PASSWORD || '',
    subscription_token:
      process.env.SUBSCRIPTION_TOKEN || 'test-subscription-token',
    synchronization_token:
      process.env.SYNCHRONIZATION_TOKEN || 'test-synchronization-token',
    stat_fetch_interval: process.env.STAT_FETCH_INTERVAL
      ? parseInt(process.env.STAT_FETCH_INTERVAL)
      : 30,
    stat_keep_history_time: process.env.STAT_KEEP_HISTORY_TIME
      ? parseInt(process.env.STAT_KEEP_HISTORY_TIME)
      : 3600,
  }
// }

export default config
