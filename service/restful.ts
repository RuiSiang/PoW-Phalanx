import Koa from 'koa'
import Auth from './auth'
import NoSql from './nosql'
import validator from 'validator'
import moment from 'moment'
import config from '../config'
import parse from 'url-parse'
import Server from './server'

export default class Restful {
  private static instance: Restful
  private server: Koa
  private socket = Server.getInstance
  private nosql = NoSql.getInstance
  public static get getInstance(): Restful {
    if (!this.instance) {
      this.instance = new Restful()
    }
    return this.instance
  }

  constructor() {
    this.server = new Koa()
    this.server.use(async (ctx) => {
      if ((await Auth.checkToken(ctx.url)) == 'model') {
        const parsedUrl = parse(ctx.url, true)
        switch (parsedUrl.pathname) {
          case '/stats':
            if (ctx.method == 'GET') {
              ctx.status = 200
              ctx.body = await this.getStats()
              break
            }
          case '/set':
            if (ctx.method == 'GET') {
              if (
                !typeof (ctx.query['difficulty'] == 'string') ||
                !validator.isInt(ctx.query['difficulty'] as string, {
                  min: 0,
                  max: 64,
                })
              ) {
                ctx.status = 400
                ctx.body = 'err_invalid_or_missing_difficulty'
                return
              }
              ctx.status = 200
              ctx.body = 'OK'
              await this.getSetDifficulty(ctx.query['difficulty'] as string)
              break
            }
        }
      } else {
        ctx.status = 403
        ctx.body = 'err_invalid_token'
      }
    })

    if (config.restful) {
      this.server.listen(config.restful_port)
    }
  }

  private getStats = async () => {
    const stats = {
      instances: [],
      settings: {},
      backend: {},
    }
    const instanceDump = await this.nosql.dumpStats()
    const instances: any = {}
    for (let i = 0; i < instanceDump.length; i++) {
      const entry = instanceDump[i]
      const features = entry.split('|')[0].split(':')
      const value = entry.split('|')[1]
      if (!instances[features[1]]) {
        instances[features[1]] = {
          legit_req: [],
          ttl_req: [],
          bad_nonce: [],
          ttl_waf: [],
          ttl_solve_time: [],
          prob_solved: [],
        }
      }
      instances[features[1]][features[0]].push(value)
    }
    stats.instances = instances

    if (config.settings_fetch) {
      const settingsDump = await this.nosql.dumpSettings()
      stats.settings = settingsDump
    }
    if (config.resource_monitor) {
      const backendResource = await this.nosql.get('backend-resource')
      stats.backend = backendResource
    }
    return stats
  }

  private getSetDifficulty = async (difficulty: string) => {
    this.socket.broadcast(
      'subscription',
      JSON.stringify({
        method: 'shld_set_config',
        arguments: ['difficulty', difficulty],
      })
    )
  }
}
