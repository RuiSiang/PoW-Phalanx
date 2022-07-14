import Server from './service/server'
import { CronJob } from 'cron'
import config from './config'
import NoSql from './service/nosql'

const server = Server.getInstance
const subscriptionCron = new CronJob(
  `*/${config.stat_fetch_interval} * * * * *`,
  function () {
    server.broadcast(
      'subscription',
      JSON.stringify({ method: 'shld_fetch_stats' })
    )
  }
)
subscriptionCron.start()
const nosql = NoSql.getInstance
const controllerCron = new CronJob(
  `*/${config.controller_broadcast_interval} * * * * *`,
  async () => {
    server.broadcast(
      'controller',
      JSON.stringify({
        method: 'ctrl_stats',
        arguments: { stats: await nosql.dumpStats(), whitelist: await nosql.dumpWhitelist() },
      })
    )
  }
)
controllerCron.start()
console.log('PoW Phalanx Initiated')
