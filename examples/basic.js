const fs = require('fs')
const path = require('path')
const express = require('express')
const session = require('express-session')
const Keycloak = require('keycloak-connect')

const { KeycloakContextProvider, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('../')

const { ApolloServer, gql } = require('apollo-server-express')

const keycloakConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config/keycloak.json')))

const app = express()

const memoryStore = new session.MemoryStore()

const graphqlPath = '/graphql'


app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}))

const keycloak = new Keycloak({
  store: memoryStore
}, keycloakConfig)

// Install general keycloak middleware
app.use(keycloak.middleware({
  admin: graphqlPath
}))

// Protect the main route for all graphql services
// Disable unauthenticated access
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
      console.log(context.auth.isAuthenticated())
      console.log(context.auth.accessToken.content.name)

      const name = context.auth.accessToken.content.preferred_username || 'world'
      return `Hello ${name}`
    }
  }
}

// Initialize the voyager server with our schema and context

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs],
  schemaDirectives: KeycloakSchemaDirectives,
  resolvers,
  context: ({ req }) => {
    return {
      auth: new KeycloakContextProvider({ req })
    }
  }
})

server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
)