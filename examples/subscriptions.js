const express = require('express')
const { PubSub } = require('graphql-subscriptions')
const { execute, subscribe } = require('graphql')
const { SubscriptionServer } = require('subscriptions-transport-ws')

const { ApolloServer, gql } = require('apollo-server-express')

const { configureKeycloak } = require('./lib/common')

const { 
  KeycloakContext,
  KeycloakSubscriptionContext,
  KeycloakTypeDefs,
  KeycloakSchemaDirectives,
  KeycloakSubscriptionHandler
} = require('../')


const app = express()

const graphqlPath = '/graphql'

// perform the standard keycloak-connect middleware setup on our app
// return the initialized keycloak object
const { keycloak } = configureKeycloak(app, graphqlPath)

const pubsub = new PubSub()

// set up the pubsub to publish a message every 2 seconds
const TOPIC = 'HELLO'
setInterval(() => {
  pubsub.publish(TOPIC, { testSubscription: `tesing... ${Date.now()}`})
}, 2000)

const typeDefs = gql`
  type Query {
    hello: String!
  }

  type Subscription {
    testSubscription: String!
  }
`

const resolvers = {
  Query: {
    hello: (obj, args, context, info) => {
      return `Hello world`
    }
  },
  Subscription: {
    testSubscription: {
      subscribe: () => pubsub.asyncIterator(TOPIC)
    }
  }
}

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs],
  schemaDirectives: KeycloakSchemaDirectives,
  subscriptions: {
    onConnect:
  }
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req })
    }
  }
})

server.applyMiddleware({ app })

const port = 4000

const httpServer = app.listen({ port }, () => {
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)

  // Initialize the keycloak subscription handler passing in our keycloak instance
  const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak })
  new SubscriptionServer({
    execute,
    subscribe,
    schema: server.schema,
    onConnect: async (connectionParams, websocket, connectionContext) => {
      const token = await keycloakSubscriptionHandler.onSubscriptionConnect(connectionParams)
      return {
        kauth: new KeycloakSubscriptionContext(token)
      }
    }
  }, {
    server: httpServer,
    path: graphqlPath
  })
})

