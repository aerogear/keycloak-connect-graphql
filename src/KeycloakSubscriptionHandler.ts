import Keycloak from './KeycloakTypings'
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
  constructor(options: KeycloakSubscriptionHandlerOptions) {
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
  public async onSubscriptionConnect(connectionParams: any, webSocket?: any, context?: any): Promise<Keycloak.Token | undefined> {
    if (!connectionParams || typeof connectionParams !== 'object') {
      if (this.protect === true) {
        const error: any = new Error(`Access Denied - missing connection parameters for Authentication`);
        error.code = "UNAUTHENTICATED"
        throw error
      }
      return
    }
    const header = connectionParams.Authorization
      || connectionParams.authorization
      || connectionParams.Auth
      || connectionParams.auth
    if (!header) {
      if (this.protect === true) {
        throw new Error(`Access Denied - missing Authorization field in connection parameters`);
      }
      return
    }
    try {
      // we don't use this naming style but
      // createGrant expects it
      const grant = await this.keycloak.grantManager.createGrant({
        access_token: this.getAccessTokenFromHeader(header)
      })

      return grant.access_token as unknown as Keycloak.Token
    } catch (e) {
      throw new Error(`Access Denied - ${e}`);
    }
  }

  private getAccessTokenFromHeader(header: any): string {
    if (header && typeof header === 'string' && (header.indexOf('bearer ') === 0 || header.indexOf('Bearer ') === 0)) {
      const tokenString = header.substring(7)
      return tokenString
    } else {
      throw new Error('Invalid Authorization field in connection params. Must be in the format "Authorization": "Bearer <token string>"')
    }
  }
}
