import { Socket } from 'socket.io'

const assessDifficulty = async (clientId: string) => {
  // console.log(await this.nosql.keys(`legit_req:${clientId}:*`))
  // console.log(await this.nosql.keys(`ttl_req:${clientId}:*`))
  // console.log(await this.nosql.keys(`bad_nonce:${clientId}:*`))
  // console.log(await this.nosql.keys(`ttl_waf:${clientId}:*`))
  return Math.floor(Math.random() * 5 + 10)
}
