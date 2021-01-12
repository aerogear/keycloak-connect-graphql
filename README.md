# keycloak-connect-graphql

[![CircleCI](https://img.shields.io/circleci/build/github/aerogear/keycloak-connect-graphql.svg)](https://circleci.com/gh/aerogear/keycloak-connect-graphql)
[![Coverage Status](https://coveralls.io/repos/github/aerogear/keycloak-connect-graphql/badge.svg)](https://coveralls.io/github/aerogear/keycloak-connect-graphql)
![npm](https://img.shields.io/npm/v/keycloak-connect-graphql.svg)
![GitHub](https://img.shields.io/github/license/aerogear/keycloak-connect-graphql.svg)

A comprehensive solution for adding [keycloak](https://www.keycloak.org/) Authentication and Authorization to your Express based GraphQL server. 

Based on the [keycloak-connect](https://github.com/keycloak/keycloak-nodejs-connect) middleware for Express. Provides useful Authentication/Authorization features within your GraphQL application.

## Features

🔒  Auth at the **GraphQL layer**. Authentication and Role Based Access Control (RBAC) on individual Queries, Mutations and fields.

⚡️  Auth on Subscriptions. Authentication and RBAC on incoming websocket connections for subscriptions.

🔑  Access to token/user information in resolver context via `context.kauth` (for regular resolvers and subscriptions)

📝  Declarative `@auth`, `@hasRole` and `@hasPermission` directives that can be applied directly in your Schema.

⚙️  `auth`, `hasRole` and `hasPermission` middleware resolver functions that can be used directly in code. (Alternative to directives)

## Getting Started

Install library 
```bash
npm install --save keycloak-connect-graphql
```

Install required dependencies:
```bash
npm install --save  graphql keycloak-connect
```

Install one of the Apollo Server libraries 
```bash
npm install --save apollo-server-express 
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
      kauth: new KeycloakContext({ req }, keycloak) // 3. add the KeycloakContext to `kauth`
    }
  }
})

server.applyMiddleware({ app })

app.listen({ 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
) 
```

In this example `keycloak.middleware()` is used on the GraphQL endpoint. This allows for **Authentication and Authorization at the GraphQL Layer**. `keycloak.middleware` parses user token information if found, but will not block unauthenticated requests. This approach gives us the flexibility to implement authentication on individual Queries, Mutations and Fields.

## Using @auth, @hasRole and @hasPermission directives (Apollo Server only)

In Apollo Server, the `@auth`, `@hasRole` and `@hasPermission` directives can be used directly on the schema.
This declarative approach means auth logic is never mixed with business logic.

```js
const Keycloak = require('keycloak-connect')
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
    unpublishArticle(title: String!):Boolean @hasPermission(resources: ["Article:publish","Article:delete"])
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
    },
	unpublishArticle: (object, args, context, info) => {
	  const user = context.kauth.accessToken.content
      return Database.deleteArticle(args.title, user)
    }
  }
}

const keycloak = new Keycloak()

const server = new ApolloServer({
  typeDefs: [KeycloakTypeDefs, typeDefs], // 1. Add the Keycloak Type Defs
  schemaDirectives: KeycloakSchemaDirectives, // 2. Add the KeycloakSchemaDirectives
  resolvers,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req }, keycloak) // 3. add the KeycloakContext to `kauth`
    }
  }
})
```

In this example a number of things are happening:

1. `@auth` is applied to the `listArticles` Query. This means a user must be authenticated for this Query.
2. `@hasRole(role: "editor")` is applied to the `publishArticle` Mutation. This means the keycloak user must have the editor *client role* in keycloak
3. `@hasPermission(resources: ["Article:publish","Article:delete"])` is applied to `unpublishArticle` Mutation. This means keycloak user must have all permissions given in resources array.
4. The `publishArticle` resolver demonstrates how `context.kauth` can be used to get the keycloak user details

### `auth`,`hasRole` and `hasPermission` middlewares.

`keycloak-connect-graphql` also exports the `auth` ,`hasRole` and `hasPermission` logic directly. They can be thought of as middlewares that wrap your business logic resolvers. This is useful if you don't have a clear way to use schema directives (e.g. when using `graphql-express`).

```js
const { auth, hasRole } = require('keycloak-connect-graphql')

const resolvers = {
  Query: {
    listArticles: auth(listArticlesResolver)
  },
  mutation: {
    publishArticle: hasRole('editor')(publishArticleResolver)
    unpublishArticle: hasPermission(['Article:publish','Article:delete'])(unpublishArticleResolver)
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

### hasPermission Usage and Options

**`@hasPermission` directive**

The syntax for the `@hasPermission` schema directive is `@hasPermission(resources: "resource:scope")` or  `@hasPermission(resources: "resource")` because a scope is  optional or for multiple resources `@hasPermission(resources: ["array", "of", "resources"])`, use colon to separate name of the resource and optionally its scope.

**`hasPermission`**

* The usage for the exported `hasPermission` function is `hasPremission('resource:scope')` or `hasPermission(['array', 'of', 'resources'])`, use colon to separate name of the resource and optionally its scope.

Both the `@hasPermission` schema directive and the exported `hasPermission` function work exactly the same.

* If a single string is provided, it returns true if the keycloak user has a permission for requested resource and its scope, if the scope is provided.
* If an array of strings is provided, it returns true if the keycloak user has **all** requested permissions.

### Error Codes

Library will return specific GraphQL errors to the client that can
be differenciated by using error codes.

Example response from GraphQL Server could look as follows:

```json
{
   "errors":[
      {
        "message":"User is not authorized. Must have one of the following roles: [admin]",
        "code": "FORBIDDEN"
      }
   ]
}
```

Possible error codes: 

- `UNAUTHENTICATED`: returned when user is not authenticated to access API because it requires login
- `FORBIDDEN`: returned when user do not have permission to perform operation 

## Authentication and Authorization on Subscriptions

The `KeycloakSubscriptionHandler` provides a way to validate incoming websocket connections to `SubscriptionServer` from [`subscriptions-transport-ws`](https://www.npmjs.com/package/subscriptions-transport-ws) for subscriptions and add the keycloak user token to the `context` in subscription resolvers.

Using `onSubscriptionConnect` inside the `onConnect` function, we can parse and validate the keycloak user token from the `connectionParams`. The example below shows the typical setup that will **ensure all subscriptions must be authenticated**.

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

By default, `onSubscriptionConnect` throws an Authentication `Error` and the subscription is cancelled if invalid `connectionParams` or an expired/invalid keycloak token is supplied. This is an easy way to force authentication on all subscriptions.

For more information, please read the generic apollo documentation on [Authentication Over Websockets.](https://www.apollographql.com/docs/apollo-server/features/subscriptions/#authentication-over-websocket)

### Advanced Authentication and Authorization on Subscriptions

The `auth` and `hasRole` middlewares can be used on individual subscriptions. Use the same code to from the [Authentication and Authorization on Subscriptions](#authentication-and-authorization-on-subscriptions) example but intialise the `KeycloakSubscriptionHandler` with `protect:false`.

```js
const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak, protect: false })
```

When `protect` is false, an error will not be thrown during the initial websocket connection attempt if the client is not authenticated. Instead, the `auth`,`hasRole` and `hasPermission` middlewares can be used on the individual subscription resolvers.

```js
const { auth, hasRole } = require('keycloak-connect-graphql')

const typeDefs = gql`
  type Message {
    content: String!
    author: String
  }

  type Comment {
    content: String!
    author: String
  }

  type Subscription {
    commentAdded: Comment!
    messageAdded: Message! @auth
    alertAdded: String @hasRole(role: "admin") 
  }
`

const resolvers = {
  Subscription: {
    commentAdded: {
      subscribe: () => pubsub.asyncIterator(COMMENT_ADDED)
    },
    messageAdded: {
      subscribe: auth(() => pubsub.asyncIterator(COMMENT_ADDED))
    },
    alertAdded: hasRole('admin')(() => pubsub.asyncIterator(ALERT_ADDED)),
    alertRemoved: hasPermission('alert:remove')(() => pubsub.asyncIterator(ALERT_REMOVED))
  }
}
```

In this hypothetical application we have three subscription type that have varying levels of Authentication/Authorization

* commentAdded - Unauthenticated users can subscribe.
* messageAdded - Only authenticated users can subscribe.
* alertAdded - Only authenticated user with the `admin` client role can subscribe
* alertRemoved - Only authenticated user with the permission on resource `alert` and scope `remove`  can subscribe

### Client Authentication over Websocket

The GraphQL client should provide the following `connectionParams` when attempting a websocket connection.

```json
{
  "Authorization": "Bearer <keycloak token value>"
}
```

The example code shows how it could be done on the client side using Apollo Client.

```js
import Keycloak from 'keycloak-js'
import { WebSocketLink } from 'apollo-link-ws'


var keycloak = Keycloak({
    url: 'http://keycloak-server/auth',
    realm: 'myrealm',
    clientId: 'myapp'
})

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:5000/',
  options: {
    reconnect: true,
    connectionParams: {
        Authorization: `Bearer ${keycloak.token}`
    }
})
```

See the Apollo Client documentation for [Authentication Params Over Websocket](https://www.apollographql.com/docs/react/advanced/subscriptions/#authentication-over-websocket).

See the Keycloak Documentation for the [Keycloak JavaScript Adapter](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)

## Usage with Apollo Federation
`keycloak-connect-graphql` can be used with [Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/) for your distributed GraphQL service.

There are 4 steps to set up `keycloak-connect-graphql` in your distributed application using [Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/). The **first 3 steps** you should do in **every service** and for the step 3 you should also do to `gateway` service, then the step 4 just in a `gateway` service. 
1. Add the `KeycloakTypeDefs` along with your own type defs.
2. Add the `KeycloakSchemaDirectives` (Apollo Server)
3. Add the `KeycloakContext` to context.kauth
4. Setup the gateway to pass `Authorization` token to all services.  

For the first 3 steps, you could see example at [Getting Started](#getting-started) section. So, The example below shows how to setup the `gateway` service.

```javascript
const { ApolloGateway, RemoteGraphQLDataSource  } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  serviceList: [
    { name: "accounts", url: "http://localhost:4001/graphql" },
    { name: "reviews", url: "http://localhost:4002/graphql" },
    { name: "products", url: "http://localhost:4003/graphql" },
    { name: "inventory", url: "http://localhost:4004/graphql" }
    // other services might be entry
  ],
  buildService({ name, url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // 4. Setup the gateway to pass `Authorization` token to all services.
        // Passing Keycloak Access Token to services.
        if (context.kauth && context.kauth.accessToken) {
          request.http.headers.set('Authorization', 'bearer '+ context.kauth.accessToken.token);
        }
      }
    })
  },

  // Experimental: Enabling this enables the query plan view in Playground.
  __exposeQueryPlanExperimental: false,
});
```

See the example project for [Apollo Federation with Keycloak](https://github.com/ilmimris/apollofederation-keycloak-demo).

> Apollo Federation does not currently support GraphQL subscription operations.

## Examples

The `examples` folder contains runnable examples that demonstrate the various ways to use this library.

* `examples/basic.js` - Shows the basic setup needed to use the library. Uses `keycloak.connect()` to require authentication on the entire GraphQL API.
* `examples/advancedAuth` - Shows how to use the `@auth` and `@hasRole` schema directives to apply auth at the GraphQL layer.
* `examples/authMiddlewares` - Shows usage of the `auth` and `hasRole` middlewares.
* `examples/resourceBasedAuht` - Shows how to use `@hasPermission` middleware.
* `subscriptions` - Shows basic subscriptions setup, requiring all subscriptions to be authenticated.
* `subscriptionsAdvanced` - Shows subscriptions that use the `auth` and `hasRole` middlewares directly on subscription resolvers
* `subscriptionsResourceBasedAuth.js` - Shows subscriptions that use the `auth` and `hasPermission` middlewares directly on subscription resolvers

> NOTE: Examples using unrelased code that needs to be compiled before use.
Please run `npm run compile` to compile source code before running examples.

## Setting up the Examples

Prerequisites:

* Docker and docker-compose installed
* Node.js and NPM installed

Start by cloning this repo.

```
git clone https://github.com/aerogear/keycloak-connect-graphql/
```

Then start a Keycloak server using `docker-compose`.

```
cd examples/config && docker-compose up
```

Now in a separate terminal, seed the keycloak server with a sample configuration.

```
$ npm run examples:seed

creating role admin
creating role developer
creating client role admin for client keycloak-connect-graphql-bearer
creating client role developer for client keycloak-connect-graphql-bearer
creating client role admin for client keycloak-connect-graphql-public
creating client role developer for client keycloak-connect-graphql-public
creating user developer with password developer
assigning client and realm roles called "developer" to user developer
creating user admin with password admin
assigning client and realm roles called "admin" to user admin
done
```

This creates a sample realm called `keycloak-connect-graphql` with some clients, roles and users that we can use in the examples.
Now we are ready to start and explore the examples.

The Keycloak console is accessible at [localhost:8080](http://localhost:8080) and the admin login is `admin/admin`. You can make any configuration changes you wish and `npm run examples:seed` will always recreate the example realm from scratch.

## Running the Basic Example

The basic example shows:

* The setup of the keycloak express middleware
* How to add **Role Based Access Control** using the `@hasRole` schema directive.

In `examples/basic.js` the GraphQL schema for the server is defined:

```js
const typeDefs = gql`
  type Query {
    hello: String @hasRole(role: "developer")
  }
`
```

The `@hasRole` directive means only users with the `developer` role are authorized to perform the `hello` query. Start the server to try it out.

```
$ node examples/basic.js
🚀 Server ready at http://localhost:4000/graphql
```

Open the URL and you will see the Keycloak login screen. First login with `developer/developer` as the username/password.

Now you should see the GraphQL Playground.

NOTE: The login page is shown because the Keycloak middleware is enforcing authentication on the `/graphql` endpoint using a `public` client configuration. A public client is being used so we can access the GraphQL Playground in the browser. In production, your GraphQL API would use a `bearer` client configuration and instead you would receive an `Access Denied` message.

On the right side of the GraphQL Playground you will see a message:

```
{
  "error": "Failed to fetch. Please check your connection"
}
```

Although the browser has authenticated with the Keycloak server, the GraphQL playround isn't sending the keycloak `Authorization` header along with its requests to the GraphQL server. In the bottom left corner of the playground there is a field called **HTTP Headers** which will be added to requests sent by the playground.

Use `scripts/getToken.js` to get a valid header for the `developer` user.

```
node scripts/getToken.js developer developer # username password

{"Authorization":"Bearer <token string>"}
```

Copy the entire JSON object, then paste it into the HTTP Headers field in the playground. The error message should disappear.

Now try the following query:

```
query {
  hello
}
```

You should see the result.

```
{
  "data": {
    "hello": "Hello developer"
  }
}
```

The `hasRole` directive checked that the user had the appropriate role and then the GraphQL resolver successfully executed. Let's change the role. Change the code in `examples/basic.js` to the code below and then restart the server.

```js
const typeDefs = gql`
  type Query {
    hello: String @hasRole(role: "admin")
  }
`
```

Now run the query in the playground again. You should see an error.

```
{
  "errors": [
    {
      "message": "User is not authorized. Must have one of the following roles: [admin]",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "hello"
      ],
      "extensions": <omitted>
    }
  ],
  "data": {
    "hello": null
  }
}
```

This time an error comes back saying the user does not have the right role. That's the full example! The process of running and trying the other examples is very similar. Feel free to try them or to look at the code!
