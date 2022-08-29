import config from '../config'
import redis, { Redis } from 'ioredis'
import redisMock from 'ioredis-mock'

class NoSql {
  private static instance: NoSql
  public static get getInstance() {
    if (!NoSql.instance) {
      try {
        NoSql.instance = new NoSql()
      } catch (err) {
        // skipcq: JS-0002
        console.log('Redis error, please check redis server status')
      }
    }
    return NoSql.instance
  }

  private dbInstance: Redis
  constructor() {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'standalone'
    ) {
      this.dbInstance = new redisMock()
    } else {
      this.dbInstance = new redis({
        host: config.database_host,
        port: config.database_port,
      })
    }
  }
  public get = async (key: string) => {
    return await this.dbInstance.get(key)
  }
  public mget = async (keys: string[]) => {
    if (keys.length) {
      return await this.dbInstance.mget(keys)
    } else {
      return []
    }
  }
  public setOverride = async (
    key: string,
    value: string,
    setexpr?: boolean,
    exprTime?: number
  ) => {
    if (setexpr) {
      return await this.dbInstance.set(key, value, 'EX', exprTime)
    } else {
      return await this.dbInstance.set(key, value)
    }
  }
  public setNX = async (
    key: string,
    value: string,
    setexpr?: boolean,
    exprTime?: number
  ) => {
    if (setexpr) {
      return await this.dbInstance.set(key, value, 'EX', exprTime, 'NX')
    } else {
      return await this.dbInstance.set(key, value, 'NX')
    }
  }
  public incr = async (key: string) => {
    await this.dbInstance.incr(key)
  }
  public del = async (key: string) => {
    await this.dbInstance.del(key)
  }
  public keys = async (pattern: string) => {
    return await this.dbInstance.keys(pattern)
  }
  public dumpStats = async () => {
    const keys = (await this.dbInstance.keys('*:*:*')).sort()
    return (await this.mget(keys)).map((item, index) => {
      return `${keys[index]}|${item}`
    })
  }
  public dumpWhitelist = async () => {
    return (await this.dbInstance.keys('wht:*')).sort()
  }
  public dumpSettings = async () => {
    const keys = (await this.dbInstance.keys('settings:*')).sort()
    return (await this.mget(keys)).map((item, index) => {
      return {[keys[index]]:JSON.parse(item)}
    })
  }
}

export default NoSql
