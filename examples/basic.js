const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const { configureKeycloak } = require('./lib/common')

const {
  KeycloakContext,
  KeycloakTypeDefs,
  KeycloakSchemaDirectives
} = require('../')

const app = express()

const graphqlPath = '/graphql'

// perform the standard keycloak-connect middleware setup on our app
const { keycloak } = configureKeycloak(app, graphqlPath)

// Ensure entire GraphQL Api can only be accessed by authenticated users
app.use(graphqlPath, keycloak.protect())

const typeDefs = gql`
  type Query {
    hello: String @hasRole(role: "developer")
  }
`

const resolvers = {
  Query: {
    hello: (obj, args, context, info) => {
      // log some of the auth related info added to the context
      console.log(context.kauth.isAuthenticated())
      console.log(context.kauth.accessToken.content.name)

      const name = context.kauth.accessToken.content.preferred_username || 'world'
      return `Hello ${name}`
    }
  }
}

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs],
  schemaDirectives: KeycloakSchemaDirectives,
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req })
    }
  }
})

server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
)