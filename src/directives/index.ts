import { HasRoleDirective, AuthDirective, HasPermissionDirective } from './schemaDirectiveVisitors'

// Using any as there is only theoretical incompatiblity between graphql-tools and apollo library
export type SchemaDirectiveMap = Record<string, any>

/**
 * Object that contains directive implementations for Apollo Server. Pass this into Apollo Server
 * to enable schemaDirectives such as `@auth` and `@hasRole`
 * 
 * Example usage:
 * 
 * ```javascript
 * const typeDefs = gql`
 *   type Query {
 *     hello: String! @auth
 *   }
 *
 *   type mutation {
 *     changeSomething(arg: String!): String! @hasRole(role: "admin")
 *   }
 * `
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
export const KeycloakSchemaDirectives: SchemaDirectiveMap = {
  auth: AuthDirective,
  hasRole: HasRoleDirective,
  hasPermission: HasPermissionDirective
}


export * from './directiveResolvers'