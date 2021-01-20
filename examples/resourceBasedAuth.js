const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const { configureKeycloak } = require('./lib/common')

const {
    KeycloakContext,
    KeycloakTypeDefs,
    KeycloakSchemaDirectives,
    hasPermission
} = require('../')

const app = express()

const graphqlPath = '/graphql'

// perform the standard keycloak-connect middleware setup on our app
const { keycloak } = configureKeycloak(app, graphqlPath)


const typeDefs = gql`
  type Article {
    id: ID!
    title: String!
    content: String!
  }

  type Query {
    listArticles: [Article]! @hasPermission(resources: "Article:view")
  }

  type Mutation {
    publishArticle(title: String!, content: String!): Article! @hasPermission(resources: ["Article:publish"])
    unpublishArticle(title: String!):Boolean @hasPermission(resources: ["Article:publish","Article:delete"])
    deleteArticle(title: String!):Boolean @hasPermission(resources: ["Article:delete"])
  }
`

const resolvers = {
  Query: {
    listArticles: (obj, args, context, info) => {
      return [{ id: 1, title: 'About authorization', content: 'A short text about authorization.' },
        { id: 2, title: 'About authentication', content: 'A short text about authentication.' },
        { id: 3, title: 'GraphQL', content: 'A short text about GraphQL' }]
    }
  },
  Mutation: {
    publishArticle: (object, args, context, info) => {
      const user = context.kauth.accessToken.content
      return { id: Math.floor(Math.random() * 100) + 10, title: args.title, content: args.content }
    },
    unpublishArticle: () => {
      return true
    },
    deleteArticle: () => {
      return true
    }
  }
}

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs], 
  schemaDirectives: KeycloakSchemaDirectives, 
  resolvers,
  context: ({ req }) => {
    return {
        kauth: new KeycloakContext({ req }, keycloak, { resource_server_id: 'keycloak-connect-graphql-resource-server'}) 
    }
  }
})

server.applyMiddleware({ app })

const port = 4000

app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
)