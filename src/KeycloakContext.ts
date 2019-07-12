import { AuthContextProvider } from './api'
import Keycloak from 'keycloak-connect'

export const CONTEXT_KEY = 'kauth'

export class KeycloakContextBase implements AuthContextProvider {
  public readonly accessToken: Keycloak.Token | undefined
  public static contextKey = CONTEXT_KEY

  constructor (token?: Keycloak.Token) {
    this.accessToken = token
  }

  /**
   * returns true if a valid, non expired access token is present
   */
  public isAuthenticated (): boolean {
    return (this.accessToken && !this.accessToken.isExpired()) ? true : false 
  }

  /**
   * 
   * Checks that the authenticated keycloak user has the role.
   * If the user has the role, the next resolver is called.
   * If the user does not have the role, an error is thrown.
   * 
   * If an array of roles is passed, it checks that the user has at least one of the roles
   * 
   * By default, hasRole checks for keycloak client roles.
   * Example: `hasRole('admin')` will check the logged in user has the client role named admin.
   * 
   * It also is possible to check for realm roles and application roles.
   * * `hasRole('realm:admin')` will check the logged in user has the admin realm role
   * * `hasRole('some-other-app:admin')` will check the loged in user has the admin realm role in a different application
   * 
   * 
   * @param role the role or array of roles to check
   */
  public hasRole (role: string): boolean {
    //@ts-ignore
    return this.isAuthenticated() && this.accessToken.hasRole(role)
  }
}

/**
 * Context builder class that adds the Keycloak token from `req.kauth` into the GraphQL context.
 * This class *must* be added to the context under `context.kauth`.
 * 
 * 
 * Example usage in Apollo Server:
 * 
 * ```javascript
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   context: ({ req }) => {
 *     return {
 *       kauth: new KeycloakContext({ req })
 *       // your other things you want in your context
 *     }
 *   }
 * })
 * ```
 * Note: This class gets the token details from `req.kauth` so you must ensure that the keycloak middleware
 * is installed on the graphql endpoint
 * 
 */
export class KeycloakContext extends KeycloakContextBase implements AuthContextProvider {
  public readonly request: Keycloak.GrantedRequest
  public readonly accessToken: Keycloak.Token | undefined

  constructor ({ req }: { req: Keycloak.GrantedRequest }) {
    const token = (req && req.kauth && req.kauth.grant) ? req.kauth.grant.access_token : undefined
    super(token)
    this.request = req
  }
}

/**
 * Context builder class that extends the original KeycloakContext object
 * but is used for building the context for subscriptions
 * 
 * example usage: 
 * 
 * ```javascript
 * const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak })
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
 * ```
 */
export class KeycloakSubscriptionContext extends KeycloakContextBase {
  /**
   * 
   * @param token a keycloak token object
   */
  constructor(token: Keycloak.Token) {
    super(token)
  }
}
