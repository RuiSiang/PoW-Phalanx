import Server from './service/server'
import { CronJob } from 'cron'
import config from './config'

const server = Server.getInstance
const cronJob = new CronJob(
  `*/${config.stat_fetch_interval} * * * * *`,
  function () {
    server.broadcast('subscription', JSON.stringify({ method: 'fetch_stats' }))
  }
)
cronJob.start()
console.log('PoW Phalanx Initiated')
