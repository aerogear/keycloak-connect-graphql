const express = require('express')
const http = require('http')
const { PubSub } = require('graphql-subscriptions')

const { ApolloServer, gql } = require('apollo-server-express')

const { configureKeycloak } = require('./lib/common')

const { 
  KeycloakContext,
  KeycloakSubscriptionContext,
  KeycloakTypeDefs,
  KeycloakSchemaDirectives,
  KeycloakSubscriptionHandler,
  auth,
  hasPermission
} = require('../dist')


const app = express()

const graphqlPath = '/graphql'

// perform the standard keycloak-connect middleware setup on our app
// return the initialized keycloak object
const { keycloak } = configureKeycloak(app, graphqlPath)

const pubsub = new PubSub()

// set up the pubsub to publish a message every 2 seconds
const TOPIC = 'HELLO'
setInterval(() => {
  pubsub.publish(TOPIC, { 
    testSubscription: `testing... ${Date.now()}`,
    testSubscriptionProtected: `testing... ${Date.now()}`
  })
}, 2000)


const typeDefs = gql`
  type Query {
    hello: String!
  }

  type Subscription {
    testSubscription: String!
    testSubscriptionProtected: String!
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
    },
    testSubscriptionProtected: {
      subscribe: auth(hasPermission('Article:view')(() => pubsub.asyncIterator(TOPIC)))
    }
  }
}

const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak, protect: false })

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs],
  schemaDirectives: KeycloakSchemaDirectives,
  resolvers,
  subscriptions: {
    onConnect: async (connectionParams, websocket, connectionContext) => {
      const token = await keycloakSubscriptionHandler.onSubscriptionConnect(connectionParams)
      return {
        kauth: new KeycloakSubscriptionContext(token, keycloak, { resource_server_id: 'keycloak-connect-graphql-resource-server'})
      }
    }
  },
  context: ({ req, connection }) => {
    const kauth = connection ? connection.context.kauth : new KeycloakContext({ req }, keycloak, { resource_server_id: 'keycloak-connect-graphql-resource-server'})
    return {
      kauth
    }
  }
})

const port = 4000

server.applyMiddleware({ app })
const httpServer = http.createServer(app)
server.installSubscriptionHandlers(httpServer)

httpServer.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
})

