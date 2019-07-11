import Keycloak from './KeycloakTypings'
import { Token } from './KeycloakToken'
import { KeycloakSubscriptionHandlerOptions } from './api'

/**
 * Provides the onSubscriptionConnect function that is used to validate incoming
 * websocket connections for subscriptions.
 * 
 * Parses and validates the keycloak token sent by the client in the connectionParams
 * 
 * Example usage:
 * 
 * ```javascript
 * const server = app.listen({ port }, () => {
 *   console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
 *
 *   const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak })
 *   new SubscriptionServer({
 *     execute,
 *     subscribe,
 *     schema: server.schema,
 *     onConnect: async (connectionParams, websocket, connectionContext) => {
 *       const token = await keycloakSubscriptionHandler.onSubscriptionConnect(connectionParams)
 *       return {
 *         kauth: new KeycloakSubscriptionContext(token)
 *       }
 *     }
 *   }, {
 *     server,
 *     path: '/graphql'
 *   })
 *})
 *```
 */
export class KeycloakSubscriptionHandler {

  public keycloak: Keycloak.Keycloak
  public protect?: boolean

  /**
   * 
   * @param options 
   */
  constructor (options: KeycloakSubscriptionHandlerOptions) {
    if (!options || !options.keycloak) {
      throw new Error('missing keycloak instance in options')
    }
    this.keycloak = options.keycloak
    this.protect = (options.protect !== null && options.protect !== undefined) ? options.protect : true
  }

  /**
   * 
   * @param connectionParams 
   * @param webSocket 
   * @param context 
   */
  public async onSubscriptionConnect(connectionParams: any, webSocket: any, context: any): Promise<Keycloak.Token | undefined | Error> {
    if (!connectionParams || typeof connectionParams !== 'object') {
      if (this.protect === true) {
        throw new Error('Access Denied - missing connection parameters for Authentication')
      }
      return
    }
    const header = connectionParams.Authorization
                  || connectionParams.authorization
                  || connectionParams.Auth
                  || connectionParams.auth
    const clientId = connectionParams.clientId
    if (!header) {
      if (this.protect === true) {
        throw new Error('Access Denied - missing Authorization field in connection parameters')
      }
      return
    }
    const token = this.getBearerTokenFromHeader(header, clientId)
    try {
      await this.keycloak.grantManager.validateToken(token, 'Bearer')
      //@ts-ignore
      return token
    } catch (e) {
      throw new Error(`Access Denied - ${e}`)
    }
  }

  private getBearerTokenFromHeader(header: any, clientId?: string) {
    if (header && typeof header === 'string' && (header.indexOf('bearer ') === 0 || header.indexOf('Bearer ') === 0)) {
      const token = header.substring(7)
      return new Token(token, clientId)
    }
  }
}
