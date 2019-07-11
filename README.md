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

There are 3 steps to set up `keycloak-connect-graphql` in your application.

1. Add the `KeycloakTypeDefs` along with your own type defs.
2. Add the `KeycloakSchemaDirectives` (Apollo Server)
3. Add the `KeycloakContext` to `context.kauth`

The example below shows a typical setup with comments beside each of the 3 steps mentioned.

```javascript
const { ApolloServer, gql } = require('apollo-server-express')
const Keycloak = require('keycloak-connect')

const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql')

const { typeDefs, resolvers } = require('./schema')

const app = express()
const keycloak = new Keycloak()

app.use(graphqlPath, keycloak.middleware())

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs], // 1. Add the Keycloak Type Defs
  schemaDirectives: KeycloakSchemaDirectives, // 2. Add the KeycloakSchemaDirectives
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req }) // 3. add the KeycloakContext to `kauth`
    }
  }
})

server.applyMiddleware({ app })

app.listen({ 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
) 
```

In this example `keycloak.middleware()` is used on the GraphQL endpoint. This allows for **Authentication and Authorization at the GraphQL Layer**. `keycloak.middleware` parses user token information if found, but will not block unauthenticated requests. This approach means gives us the flexibility to implement authentication on individual Queries, Mutations and Fields.

## Using @auth and @hasRole directives (Apollo Server only)

In Apollo Server, the `@auth` and `@hasRole` directives can be used directly on the schema.
This declarative approach means auth logic is never mixed with business logic.

```js

const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql')

const typeDefs = gql`
  type Article {
    id: ID!
    title: String!
    content: String!
  }

  type Query {
    listArticles: [Article]! @auth
  }

  type Mutation {
    publishArticle(title: String!, content: String!): Article! @hasRole(role: "editor")
  }
`

const resolvers = {
  Query: {
    listArticles: (obj, args, context, info) => {
      return Database.listArticles()
    }
  },
  mutation: {
    publishArticle: (object, args, context, info) => {
      const user = context.kauth.accessToken.content // get the user details from the access token
      return Database.createArticle(args.title, args.content, user)
    }
  }
}

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs], // 1. Add the Keycloak Type Defs
  schemaDirectives: KeycloakSchemaDirectives, // 2. Add the KeycloakSchemaDirectives
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req }) // 3. add the KeycloakContext to `kauth`
    }
  }
})
```

In this example a number of things are happening:

1. `@auth` is applied to the `listArticles` Query. This means a user must be authenticated for this Query.
2. `@hasRole(role: "editor")` is applied to the `publishArticle` Mutation. This means the keycloak user must have the editor *client role* in keycloak
3. The `publishArticle` resolver demonstrates how `context.kauth` can be used to get the keycloak user details

### Using the `auth` and `hasRole` resolvers directly.

`keycloak-connect-graphql` also exports the `auth` and `hasRole` logic directly. They can be thought of as middlewares that wrap your business logic resolvers. This is useful if you don't have a clear way to use schema directives (e.g. when using `graphql-express`).

```js
const { auth, hasRole } = require('keycloak-connect-graphql')

const resolvers = {
  Query: {
    listArticles: auth(listArticlesResolver)
  },
  mutation: {
    publishArticle: hasRole('editor')(publishArticleResolver)
  }
}
```

### hasRole Usage and Options

**`@hasRole` directive**

The syntax for the `@hasRole` schema directive is `@hasRole(role: "rolename")` or `@hasRole(role: ["array", "of", "roles"])`

**`hasRole`**

* The usage for the exported `hasRole` function is `hasRole('rolename')` or `hasRole(['array', 'of', 'roles'])`

Both the `@hasRole` schema directive and the exported `hasRole` function work exactly the same.

* If a single string is provided, it returns true if the keycloak user has a **client role** with that name.
* If an array of strings is provided, it returns true if the keycloak user has **at least one** client role that matches.

By default, hasRole checks for keycloak client roles.

* Example: `hasRole('admin')` will check the logged in user has the client role named admin.

It also is possible to check for realm roles and application roles.
* `hasRole('realm:admin')` will check the logged in user has the admin realm role
* `hasRole('some-other-app:admin')` will check the loged in user has the admin realm role in a different application

## Authentication and Authorization on Subscriptions

The `KeycloakSubscriptionHandler` provides a way to validate incoming websocket connections to [`SubscriptionServer`]() from [`subscriptions-transport-ws`](https://www.npmjs.com/package/subscriptions-transport-ws) for subscriptions and add the keycloak user token to the `context` in subscription resolvers.

Using , we can a small amount of code to the `onConnect` function to parse and validate the keycloak user token from the `connectionParams`.

```js
const { KeycloakSubscriptionHandler } = require('keycloak-connect-graphql')

// Apollo Server Setup Goes Here. (See Getting Started Section)

const httpServer = app.listen({ port }, () => {
   console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)

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
     path: '/graphql'
   })
})
```

In this example, `keycloakSubscriptionHandler.onSubscriptionConnect` parses the connectionParams into a Keycloak Access Token. The value returned from `onConnect` becomes the `context` in subscription resolvers. By returning `{ kauth: new KeycloakSubscriptionContext }` we will have access to the keycloak user token in our subscription resolvers.

By default, `onSubscriptionConnect` throws an Authentication `Error` and the subscription is cancelled if invalid `connectionParams` or an expired/invalid keycloak token is supplied. This is an easy way to require authentication on all subscriptions.

### Advanced Authentication and Authorization on Subscriptions

TODO

### What Connection Params Should the Client Send?

The GraphQL client should provide the following `connectionParams` when attempting a websocket connection.

```
{
  "Authorization": "Bearer <keycloak token value>",
  "clientId": "<name of the clientId assigned to the application in Keycloak>"
}
```

See the Apollo Client documentation.

## Examples

TODO
