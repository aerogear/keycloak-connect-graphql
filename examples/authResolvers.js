const fs = require('fs')
const path = require('path')
const express = require('express')
const session = require('express-session')
const Keycloak = require('keycloak-connect')
const { ApolloServer, gql } = require('apollo-server-express')

const { KeycloakContext, KeycloakTypeDefs, auth, hasRole } = require('../')

const app = express()

const memoryStore = new session.MemoryStore()

const graphqlPath = '/graphql'


app.use(session({
  secret: process.env.SESSION_SECRET_STRING || 'this should be a long secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}))

const keycloakConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config/keycloak.json')))

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
    addGreeting(greeting: String!): String!
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
    addGreeting: auth(hasRole('developer')((obj, { greeting }, context, info) => {
      greetings.push(greeting)
      return greeting
    }))
  }
}

// Initialize the voyager server with our schema and context
const options ={
  typeDefs: [KeycloakTypeDefs, typeDefs],
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req })
    }
  }
}

const server = new ApolloServer(options)

server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
) 