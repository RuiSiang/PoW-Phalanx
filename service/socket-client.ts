import { io, Socket } from 'socket.io-client'
import Server from './server'

export default class Client {
  private socket: Socket
  private static instance: Client
  private server = Server.getInstance

  public static getInstance(url: string) {
    if (!Client.instance) {
      try {
        Client.instance = new Client(url)
      } catch (err) {
        console.log('Socket init error')
      }
    }
    return Client.instance
  }

  constructor(url: string) {
    this.socket = io(url, {
      reconnectionDelayMax: 10000,
    })
    this.socket.on('connect', () => {
      console.log('Connected to resource monitor')
    })
    this.socket.on('disconnect', () => {
      console.log('Disconnected from resource monitor')
    })
    this.socket.on('message', (payload) => {
      this.server.broadcast(
        'model',
        JSON.stringify({
          method: 'modl_backend_stats',
          arguments: payload,
        })
      )
    })
  }
}
