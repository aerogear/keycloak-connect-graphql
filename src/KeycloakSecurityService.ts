import { Router } from 'express'
import session from 'express-session'
import Keycloak from 'keycloak-connect'
import { KeycloakAuthContextProvider } from './AuthContextProvider'
import { schemaDirectives } from './schemaDirectives'
import { Token } from './KeycloakToken'

import {
  SecurityService,
  ApplyAuthMiddlewareOptions,
  KeycloakSecurityServiceOptions,
  AuthContextProviderClass,
  Logger,
  SchemaDirectives
} from './api'

export class KeycloakSecurityService implements SecurityService {

  public readonly keycloakConfig: any
  public readonly schemaDirectives: any
  public readonly authContextProvider: any
  public keycloak: any
  public readonly log: Logger

  constructor (keycloakConfig: any, options?: KeycloakSecurityServiceOptions) {
    this.keycloakConfig = keycloakConfig
    this.schemaDirectives = schemaDirectives
    this.authContextProvider = KeycloakAuthContextProvider
    this.log = options && options.log ? options.log : console
    if (options && options.keycloak) {
      this.keycloak = options.keycloak
    }
  }

  public getTypeDefs(): string {
    return `directive @hasRole(role: [String]) on FIELD | FIELD_DEFINITION
    directive @auth on FIELD | FIELD_DEFINITION`
  }

  public getSchemaDirectives (): SchemaDirectives {
    return this.schemaDirectives
  }

  public getAuthContextProvider (): AuthContextProviderClass {
    return this.authContextProvider
  }

  /**
   * Create keycloak middleware if needed.
   *
   * @param {*} expressRouter express router that should be used to attach auth
   * @param {string} apiPath  location of the protected api
   */
  public applyAuthMiddleware (expressRouter: Router, options?: ApplyAuthMiddlewareOptions) {

    if (!this.keycloakConfig) {
      return this.log.info('Keycloak authentication is not configured')
    }

    const apiPath = options && options.apiPath ? options.apiPath : '/graphql'
    const tokenEndpoint = options && options.tokenEndpoint ? options.tokenEndpoint : false

    this.log.info('Initializing Keycloak authentication')
    const memoryStore = new session.MemoryStore()

    expressRouter.use(session({
      secret: this.keycloakConfig.secret || 'secret',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }))

    if (!this.keycloak) {
      this.keycloak = new Keycloak({
        store: memoryStore
      }, this.keycloakConfig)
    }

    // Install general keycloak middleware
    expressRouter.use(this.keycloak.middleware({
      admin: apiPath
    }))

    // Protect the main route for all graphql services
    // Disable unauthenticated access
    expressRouter.use(apiPath, this.keycloak.protect())

    if (tokenEndpoint) {
      expressRouter.get('/token', this.keycloak.protect(), function (req, res) {
        if (req.session && req.session['keycloak-token']) {
          return res.json({
            'Authorization': 'Bearer ' + JSON.parse(req.session['keycloak-token']).access_token
          })
        }
        res.json({})
      })
    }
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
      this.log.error(`Error validating token from connectionParam ${header}\n${e}`)
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
