# keycloak-connect-graphql

[![CircleCI](https://circleci.com/gh/aerogear/keycloak-connect-graphql.svg?style=svg)](https://circleci.com/gh/aerogear/keycloak-connect-graphql)

A comprehensive solution for adding [keycloak](https://www.keycloak.org/) Authentication and Authorization to your Express based GraphQL server. 

Based on the [keycloak-connect](https://github.com/keycloak/keycloak-nodejs-connect) middleware for Express. Provides useful Authentication/Authorization features within your GraphQL application.

## Features

🔒  Auth at the **GraphQL layer**. Authentication and Role Based Access Control (RBAC) on individual Queries, Mutations and fields.

⚡️  Auth on Subscriptions. Authentication and RBAC on incoming websocket connections for subscriptions.

🔑  Access to token/user information in resolver context via `context.kauth` (for regular resolvers and subscriptions)

📝  Declarative `@auth` and `@hasRole` directives that can be applied directly in your Schema.

⚙️  `auth` and `hasRole` middleware resolver functions that can be used directly in code. (Alternative to directives)

## Getting Started

```bash
npm install keycloak-connect-graphql
```

```javascript
const { ApolloServer, gql } = require('apollo-server-express')
const Keycloak = require('keycloak-connect')

const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql')

const app = express()
const keycloak = new Keycloak()

// Install general keycloak middleware
app.use(graphqlPath, keycloak.middleware())

const typeDefs = gql`
  type Query {
    greetings: [String]!
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

// Initialize the voyager server with our schema and context
const options ={
  typeDefs: [KeycloakTypeDefs, typeDefs],
  schemaDirectives: KeycloakSchemaDirectives,
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req })
    }
  }
}

const server = new ApolloServer(options)

server.applyMiddleware({ app })

app.listen({ 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
) 
```
