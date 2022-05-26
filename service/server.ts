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

    this.server.listen(parseInt(process.env.PORT || '6000'))
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
      case 'update_stats':
        if (!obj.arguments.every((value) => validator.isInt(value))) {
          return
        }
        console.log(`Stats sent from ${client.id}`)
        console.log({
          legit_req: obj.arguments[0],
          ttl_req: obj.arguments[1],
          bad_nonce: obj.arguments[2],
          ttl_waf: obj.arguments[3],
        })
        this.nosql.setNX(
          `legit_req:${client.id}:${moment().toISOString()}`,
          obj.arguments[0],
          true,
          config.stat_keep_history_time
        )
        this.nosql.setNX(
          `ttl_req:${client.id}:${moment().toISOString()}`,
          obj.arguments[1],
          true,
          config.stat_keep_history_time
        )
        this.nosql.setNX(
          `bad_nonce:${client.id}:${moment().toISOString()}`,
          obj.arguments[2],
          true,
          config.stat_keep_history_time
        )
        this.nosql.setNX(
          `ttl_waf:${client.id}:${moment().toISOString()}`,
          obj.arguments[3],
          true,
          config.stat_keep_history_time
        )
        break
      case 'ban':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'ban',
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
      case 'override_difficulty':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'set_config',
            arguments: ['difficulty', obj.arguments[0]],
          })
        )
        break
      case 'add_whitelist':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'add_whitelist',
            arguments: [obj.arguments[0]],
          })
        )
        break
      case 'remove_whitelist':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'remove_whitelist',
            arguments: [obj.arguments[0]],
          })
        )
        break
      case 'update_model':
        // TODO
        break
    }
  }

  private modelProcessor = async (message: string, client: Socket.Socket) => {
    const obj: { method: string; arguments: string[] } =
      typeof message == 'string' ? JSON.parse(message) : message
    switch (obj.method) {
      case 'set_difficulty':
        this.broadcast(
          'subscription',
          JSON.stringify({
            method: 'set_config',
            arguments: ['difficulty', obj.arguments[0]],
          })
        )
        break
      case 'fetch_batch_stats':
        client.send(
          JSON.stringify({
            method: 'batch_stats',
            arguments: await this.nosql.dump(),
          })
        )
        break
    }
  }
}
