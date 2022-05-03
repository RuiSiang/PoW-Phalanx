import Socket from 'socket.io'
import Auth from './auth'
import Controller from './controller'

export default class Server {
  private static instance: Server
  private server: Socket.Server
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
            await Controller.subscriptionProcessor(message, client)
            break
          case 'controller':
            await Controller.controllerProcessor(message, client)
            break
          case 'model':
            await Controller.modelProcessor(message, client)
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
}
