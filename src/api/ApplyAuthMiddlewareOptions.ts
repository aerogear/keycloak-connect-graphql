export interface ApplyAuthMiddlewareOptions {
  /**
   * The graphql endpoint you want to protect
   * @default /graphql
   */
  apiPath: string

  /**
   * If true, adds a /token endpoint where a user logged in
   * via their browser can get back their parsed token.
   * Useful for development activities such as authenticating with GraphQL playground.
   * Not for production usage.
   * @default false
   */
  tokenEndpoint: boolean
}
