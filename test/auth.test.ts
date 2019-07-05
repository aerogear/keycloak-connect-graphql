import test from 'ava'
import sinon from 'sinon'

import { GraphQLSchema } from 'graphql'
import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor'
import { AuthDirective } from '../src/directives/schemaDirectiveVisitors'

import { KeycloakAuthContextProvider } from '../src/AuthContextProvider'

const createHasRoleDirective = () => {
  return new AuthDirective({
    name: 'testAuthDirective',
    visitedType: ({} as VisitableSchemaType),
    schema: ({} as GraphQLSchema),
    context: []
  })
}

test('happy path: context.auth.isAuthenticated() is called, then original resolver is called', async (t) => {
  const directive = createHasRoleDirective()

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
    },
    name: 'testField'
  }

  const resolverSpy = sinon.spy(field, 'resolve')

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          isExpired: () => {
            return false
          }
        }
      }
    }
  }
  const context = {
    request: req,
    auth: new KeycloakAuthContextProvider({ req })
  }

  const isAuthenticatedSpy = sinon.spy(context.auth, 'isAuthenticated')

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
  
  t.truthy(isAuthenticatedSpy.called)
  t.truthy(resolverSpy.called)
})

test('resolver will throw if context.auth is not present', async (t) => {
  const directive = createHasRoleDirective()

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.fail()
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          isExpired: () => {
            return false
          }
        }
      }
    }
  }
  const context = {
    request: req
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, 'User not Authenticated')
})

test('resolver will throw if context.auth present but context.auth.isAuthenticated returns false', async (t) => {
  const directive = createHasRoleDirective()

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.fail()
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {}

  const context = {
    request: req,
    auth: {
      isAuthenticated: () => false
    }
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, 'User not Authenticated')
})