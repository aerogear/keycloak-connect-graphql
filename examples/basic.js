const fs = require('fs')
const path = require('path')
const express = require('express')

const { KeycloakSecurityService } = require('../')

const { ApolloServer, gql } = require('apollo-server-express')

const keycloakConfigPath = process.env.KEYCLOAK_CONFIG || path.resolve(__dirname, './config/keycloak.json')
const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath))

const typeDefs = gql`
  type Query {
    hello: String @hasRole(role: "developer")
  }
`

const resolvers = {
  Query: {
    hello: (obj, args, context, info) => {
      // log some of the auth related info added to the context
      console.log(context.auth.isAuthenticated())
      console.log(context.auth.accessToken.content.name)

      const name = context.auth.accessToken.content.preferred_username || 'world'
      return `Hello ${name}`
    }
  }
}

// Initialize the keycloak service
const keycloakService = new KeycloakSecurityService(keycloakConfig)

const AuthContextProvider = keycloakService.getAuthContextProvider()

// Initialize the voyager server with our schema and context

const server = new ApolloServer({
  typeDefs: [keycloakService.getTypeDefs(), typeDefs],
  schemaDirectives: keycloakService.getSchemaDirectives(),
  resolvers,
  context: ({ req }) => {
    return {
      auth: new AuthContextProvider({ req })
    }
  }
})

const app = express()

// Apply the keycloak middleware to the express app.
// It's very important this is done before
// Applying the apollo middleware
// This function can also take an `options` argument
// To specify things like apiPath and tokenEndpoint
keycloakService.applyAuthMiddleware(app, { tokenEndpoint: true })
server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
)