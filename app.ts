import Server from './service/server'
import { CronJob } from 'cron'
import config from './config'
import NoSql from './service/nosql'
import Client from './service/socket-client'
import Restful from './service/restful'

const server = Server.getInstance
const restful = Restful.getInstance
const subscriptionCron = new CronJob(
  `*/${config.stat_fetch_interval} * * * * *`,
  function () {
    server.broadcast(
      'subscription',
      JSON.stringify({ method: 'shld_fetch_stats' })
    )
    if (config.settings_fetch) {
      server.broadcast(
        'subscription',
        JSON.stringify({ method: 'shld_fetch_settings' })
      )
    }
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
        arguments: {
          stats: await nosql.dumpStats(),
          whitelist: await nosql.dumpWhitelist(),
        },
      })
    )
  }
)
controllerCron.start()
console.log('PoW Phalanx Initiated')

if (config.resource_monitor) {
  Client.getInstance(
    `http://${config.resource_monitor_host}:${config.resource_monitor_port}`
  )
}
