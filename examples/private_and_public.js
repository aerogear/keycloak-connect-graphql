const fs = require('fs')
const path = require('path')
const express = require('express')
const session = require('express-session')
const Keycloak = require('keycloak-connect')

const { KeycloakSecurityService } = require('../')

const { ApolloServer, gql } = require('apollo-server-express')

const keycloakConfigPath = process.env.KEYCLOAK_CONFIG || path.resolve(__dirname, './config/keycloak.json')
const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath))


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
app.use(graphqlPath, keycloak.middleware())

const typeDefs = gql`
  type Query {
    greetings: [String]!
  }

  type Mutation {
    addGreeting(greeting: String!): String! @auth
  }
`

const greetings = [
  'hello world!'
]

const resolvers = {
  Query: {
    greetings: () => greetings
  },
  Mutation: {
    addGreeting: (obj, { greeting }, context, info) => {
      greetings.push(greeting)
      return greeting
    }
  }
}

// Initialize the keycloak service
const keycloakService = new KeycloakSecurityService(keycloakConfig, { keycloak })

const AuthContextProvider = keycloakService.getAuthContextProvider()

// Initialize the voyager server with our schema and context
const options ={
  typeDefs: [keycloakService.getTypeDefs(), typeDefs],
  schemaDirectives: keycloakService.getSchemaDirectives(),
  resolvers,
  context: ({ req }) => {
    return {
      auth: new AuthContextProvider({ req })
    }
  }
}

const server = new ApolloServer(options)

server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
) 