import { AuthContextProvider } from './api'
import Keycloak from 'keycloak-connect'

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
 */
export class KeycloakContext implements AuthContextProvider {
  public readonly request: Keycloak.GrantedRequest
  public readonly accessToken: Keycloak.Token | undefined

  constructor ({ req }: { req: Keycloak.GrantedRequest }) {
    this.request = req
    this.accessToken = (req && req.kauth && req.kauth.grant) ? req.kauth.grant.access_token : undefined
  }

  public isAuthenticated (): boolean {
    return (this.accessToken && !this.accessToken.isExpired()) ? true : false 
  }

  public hasRole (role: string): boolean {
    //@ts-ignore
    return this.isAuthenticated() && this.accessToken.hasRole(role)
  }
}
