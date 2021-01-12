import { CONTEXT_KEY } from '../KeycloakContext'
import { isAuthorizedByRole } from './utils'

/**
 *
 * @param next - The resolver function you want to wrap with the auth resolver
 *
 * Checks if the incoming request to the GraphQL server is authenticated.
 * Does this by checking that `context.kauth` is present and that the token is valid.
 * The keycloak middleware must be set up on your GraphQL endpoint.
 *
 * Example usage:
 *
 * ```javascript
 * const { auth } = require('keycloak-connect-graphql')
 *
 * const typeDefs = gql`
 *   type Query {
 *     hello: String
 *   }
 * `
 *
 * const hello = (root, args, context, info) => 'Hello World'
 *
 * const resolvers = {
 *   hello: auth(hello)
 * }
 *
 * const server = new ApolloServer({
  *   typeDefs,
  *   resolvers,
  *   schemaDirectives: [KeycloakSchemaDirectives],
  *   context: ({ req }) => {
   *     return {
   *       kauth: new KeycloakContext({ req })
   *     }
   *   }
  * })
 * ```
 *
 */
export const auth = (next: Function) => (...params: any[]) => {
  let context = params[2]
  if (!context[CONTEXT_KEY] || !context[CONTEXT_KEY].isAuthenticated()) {
    const error: any = new Error(`User not Authenticated`);
    error.code = "UNAUTHENTICATED"
    throw error
  }
  return next.apply( null, params )
}

/**
 *
 * @param roles - The role or array of roles you want to authorize the user against.
 *
 * Checks if the authenticated keycloak user has the role.
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
 * Example usage:
 *
 * ```javascript
 * const { hasRole } = require('keycloak-connect-graphql')
 *
 * const typeDefs = gql`
 *   type Query {
 *     hello: String
 *   }
 * `
 *
 * const hello = (root, args, context, info) => 'Hello World'
 *
 * const resolvers = {
 *   hello: hasRole('admin')(hello)
 * }
 *
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   schemaDirectives: [KeycloakSchemaDirectives],
 *   context: ({ req }) => {
  *     return {
  *       kauth: new KeycloakContext({ req })
  *     }
  *   }
 * })
 * ```
 */
export const hasRole = (roles: Array<string>) => (next: Function) => (...params: any[]) => {
  let context = params[2]
  if (!context[CONTEXT_KEY] || !context[CONTEXT_KEY].isAuthenticated()) {
    const error: any = new Error(`User not Authenticated`);
    error.code = "UNAUTHENTICATED"
    throw error
  }

  if (typeof roles === 'string') {
    roles = [roles]
  }

  if (!isAuthorizedByRole(roles, context)) {
    const error: any = new Error(`User is not authorized. Must have one of the following roles: [${roles}]`);
    error.code = "FORBIDDEN"
    throw error
  }

  return next.apply( null, params )
}

/**
 *
 * @param permissions - The permission or array of permissions you want to authorize the user against.
 *
 * Checks if the authenticated keycloak user has the requested permissions.
 * If the user has all requested permissions, the next resolver is called.
 * If the user does not have all requested permissions, an error is thrown.
 *
 * Example usage:
 *
 * ```javascript
 * // perform the standard keycloak-connect middleware setup on our app
 * const { keycloak } = configureKeycloak(app, graphqlPath)
 * const { hasPermission } = require('keycloak-connect-graphql')
 *
 * const typeDefs = gql`
 *   type Query {
 *     hello: String
 *   }
 * `
 *
 * const hello = (root, args, context, info) => 'Hello World'
 *
 * const resolvers = {
 *   hello: hasPermission('Article:view')(hello)
 * }
 *
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   schemaDirectives: [KeycloakSchemaDirectives],
 *   context: ({ req }) => {
  *     return {
  *       kauth: new KeycloakContext({ req }, keycloak)
  *     }
  *   }
 * })
 * ```
 */
export const hasPermission = (permissions: Array<string>) => (next: Function) => async (...params: any[]) => {
  let context = params[2]
  if (!context[CONTEXT_KEY] || !context[CONTEXT_KEY].isAuthenticated()) {
    const error: any = new Error(`User not Authenticated`);
    error.code = "UNAUTHENTICATED"
    throw error
  }

  if (!await context.kauth.hasPermission(permissions)) {
    const error: any = new Error(`User is not authorized. Must have the following permissions: [${permissions}]`);
    error.code = "FORBIDDEN"
    throw error
  }

  return next.apply( null, params )
}