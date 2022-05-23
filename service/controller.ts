import { Socket } from 'socket.io'
import NoSql from './nosql'
import moment from 'moment'
import validator from 'validator'
import config from '../config'
import Server from './server'

export default class Controller {
  private static nosql = NoSql.getInstance
  private static server = Server.getInstance

  public static subscriptionProcessor = async (
    message: string,
    client: Socket
  ) => {
    const obj: { method: string; arguments: string[] } = JSON.parse(message)
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
        this.server.broadcast(
          'subscription',
          JSON.stringify({
            method: 'ban',
            arguments: obj.arguments,
          })
        )
        break
    }
  }

  public static controllerProcessor = async (
    message: string,
    client: Socket
  ) => {
    const obj: { method: string; arguments: string[] } = JSON.parse(message)
    switch (obj.method) {
      case 'override_difficulty':
        this.server.broadcast(
          'subscription',
          JSON.stringify({
            method: 'set_config',
            arguments: ['difficulty', obj.arguments[0]],
          })
        )
        break
      case 'add_whitelist':
        this.server.broadcast(
          'subscription',
          JSON.stringify({
            method: 'add_whitelist',
            arguments: [obj.arguments[0]],
          })
        )
        break
      case 'remove_whitelist':
        this.server.broadcast(
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

  public static modelProcessor = async (message: string, client: Socket) => {
    const obj: { method: string; arguments: string[] } = JSON.parse(message)
    switch (obj.method) {
      case 'set_difficulty':
        this.server.broadcast(
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
            arguments: this.nosql.dump(),
          })
        )
        break
    }
  }
}
