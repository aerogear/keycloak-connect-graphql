import { Token } from './KeycloakToken'
import { KeycloakSubscriptionHandlerOptions } from './api'

export class KeycloakSubscriptionHandler {

  public readonly keycloakConfig: any
  public readonly schemaDirectives: any
  public readonly authContextProvider: any
  public keycloak: any

  constructor (options: KeycloakSubscriptionHandlerOptions) {
    if (!options.keycloak) {
      throw new Error('missing keycloak instance in options')
    }
    this.keycloak = options.keycloak
  }

  public async onSubscriptionConnect(connectionParams: any, webSocket: any, context: any): Promise<any> {
    if (!connectionParams || typeof connectionParams !== 'object') {
      throw new Error('Access Denied - missing connection parameters for Authentication')
    }
    const header = connectionParams.Authorization
                  || connectionParams.authorization
                  || connectionParams.Auth
                  || connectionParams.auth
    const clientId = connectionParams.clientId
    if (!header) {
      throw new Error('Access Denied - missing Authorization field in connection parameters')
    }
    const token = this.getBearerTokenFromHeader(header, clientId)
    try {
      await this.keycloak.grantManager.validateToken(token, 'Bearer')
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
