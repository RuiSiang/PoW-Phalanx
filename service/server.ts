import Socket from 'socket.io'
import Auth from './auth'
import NoSql from './nosql'
import validator from 'validator'
import moment from 'moment'
import config from '../config'

export default class Server {
  private static instance: Server
  private server: Socket.Server
  private nosql = NoSql.getInstance
  public static get getInstance(): Server {
    if (!this.instance) {
      this.instance = new Server()
    }
    return this.instance
  }

  constructor() {
    this.server = new Socket.Server({ path: '/' })
    this.server.on('connection', async (client) => {
      const channel = await Auth.checkToken(client.request.url)
      if (channel) {
        client.join(channel)
        console.log(
          `Client ${client.id} connected and subscribed to ${channel} channel`
        )
      } else {
        client.disconnect(true)
        return
      }
      client.on('message', async (message: string) => {
        switch (channel) {
          case 'subscription':
            await this.subscriptionProcessor(message, client)
            break
          case 'controller':
            await this.controllerProcessor(message, client)
            break
          case 'model':
            await this.modelProcessor(message, client)
            break
          default:
            console.log(message)
            break
        }
      })
      this.server.on('disconnect', () => {
        console.log(`Client ${client.id} connected`)
      })
    })

    this.server.on('error', (err) => {
      console.log(`Websocket Error: ${err.name} ${err.message}`)
    })

    this.server.listen(config.port)
  }

  public broadcast = (channel: string, message: string) => {
    this.server.to(channel).emit('message', message)
  }

  private subscriptionProcessor = async (
    message: string,
    client: Socket.Socket
  ) => {
    const obj: { method: string; arguments: string[] } =
      typeof message == 'string' ? JSON.parse(message) : message
    switch (obj.method) {
      case 'phlx_update_stats':
        if (!obj.arguments.every((value) => validator.isInt(value))) {
          return
        }
        console.log(`Stats sent from ${client.id}`)
        console.log({
          legit_req: obj.arguments[0],
          ttl_req: obj.arguments[1],
          bad_nonce: obj.arguments[2],
          ttl_waf: obj.arguments[3],
          ttl_solve_time: obj.arguments[4],
          prob_solved: obj.arguments[5],
        })
        await this.nosql.setNX(
          `legit_req:${client.id}:${moment().toISOString()}`,
          obj.arguments[0],
          true,
          config.stat_keep_history_time
        )
        await this.nosql.setNX(
          `ttl_req:${client.id}:${moment().toISOString()}`,
          obj.arguments[1],
          true,
          config.stat_keep_history_time
        )
        await this.nosql.setNX(
          `bad_nonce:${client.id}:${moment().toISOString()}`,
          obj.arguments[2],
          true,
          config.stat_keep_history_time
        )
        await this.nosql.setNX(
          `ttl_waf:${client.id}:${moment().toISOString()}`,
          obj.arguments[3],
          true,
          config.stat_keep_history_time
        )
        await this.nosql.setNX(
          `ttl_solve_time:${client.id}:${moment().toISOString()}`,
          obj.arguments[4],
          true,
          config.stat_keep_history_time
        )
        await this.nosql.setNX(
          `prob_solved:${client.id}:${moment().toISOString()}`,
          obj.arguments[5],
          true,
          config.stat_keep_history_time
        )
        break
      case 'phlx_update_settings':
        console.log(`Settings sent from ${client.id}`)
        console.log(obj.arguments[0])
        await this.nosql.setOverride(
          `settings:${client.id}`,
          JSON.stringify(obj.arguments[0]),
          true,
          config.stat_keep_history_time
        )
        break
      case 'phlx_ban_ip':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'shld_ban_ip',
            arguments: obj.arguments,
          })
        )
        break
    }
  }

  private controllerProcessor = async (
    message: string,
    client: Socket.Socket
  ) => {
    const obj: { method: string; arguments: string[] } =
      typeof message == 'string' ? JSON.parse(message) : message
    switch (obj.method) {
      case 'phlx_override_difficulty':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'shld_set_config',
            arguments: ['difficulty', obj.arguments[0]],
          })
        )
        break
      case 'phlx_add_whitelist':
        await this.nosql.setNX(`wht:${obj.arguments[0]}`, '1')
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'shld_add_whitelist',
            arguments: [obj.arguments[0]],
          })
        )
        break
      case 'phlx_remove_whitelist':
        await this.nosql.del(`wht:${obj.arguments[0]}`)
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'shld_remove_whitelist',
            arguments: [obj.arguments[0]],
          })
        )
        break
      case 'phlx_update_model':
        // TODO
        break
    }
  }

  private modelProcessor = async (message: string, client: Socket.Socket) => {
    const obj: { method: string; arguments: string[] } =
      typeof message == 'string' ? JSON.parse(message) : message
    switch (obj.method) {
      case 'phlx_set_difficulty':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'shld_set_config',
            arguments: ['difficulty', obj.arguments[0]],
          })
        )
        break
      case 'phlx_fetch_batch_stats':
        const dump = await this.nosql.dumpStats()
        if (obj.arguments[0]) {
          client.send(
            JSON.stringify({
              method: 'modl_batch_stats',
              arguments: dump.filter((item: string) => item > obj.arguments[0]),
            })
          )
        } else {
          client.send(
            JSON.stringify({
              method: 'modl_batch_stats',
              arguments: dump,
            })
          )
        }
        if (config.settings_fetch) {
          const dump = await this.nosql.dumpSettings()
          client.send(
            JSON.stringify({
              method: 'modl_settings',
              arguments: JSON.stringify(dump),
            })
          )
        }
        break
    }
  }
}
