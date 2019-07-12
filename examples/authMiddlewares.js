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
configureKeycloak(app, graphqlPath)

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