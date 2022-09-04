import Koa from 'koa'
import Auth from './auth'
import NoSql from './nosql'
import validator from 'validator'
import moment from 'moment'
import config from '../config'
import parse from 'url-parse'

export default class Restful {
  private static instance: Restful
  private server: Koa
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
            ctx.status = 200
            ctx.body = await this.getStats()
            break
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
    stats.instances = instanceDump

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
}
