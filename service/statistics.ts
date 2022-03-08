import { Socket } from 'socket.io'
import NoSql from './nosql'
import moment from 'moment'
import validator from 'validator'
import config from '../config'

export default class Statistics {
  private static nosql = NoSql.getInstance

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
        this.nosql.setNX(
          `req:${client.id}:${moment().toISOString()}`,
          obj.arguments[0],
          true,
          config.stat_keep_history_time
        )
        this.nosql.setNX(
          `waf:${client.id}:${moment().toISOString()}`,
          obj.arguments[1],
          true,
          config.stat_keep_history_time
        )
        client.emit(
          'message',
          JSON.stringify({
            method: 'set_config',
            arguments: ['difficulty', await this.assessDifficulty(client.id)],
          })
        )
        break
    }
  }

  public static controllerProcessor = (message: string, client: Socket) => {}

  private static assessDifficulty = async (clientId: string) => {
    // console.log(await this.nosql.keys(`req:${clientId}:*`))
    // console.log(await this.nosql.keys(`waf:${clientId}:*`))
    return Math.floor(Math.random() * 5 + 10)
  }
}
