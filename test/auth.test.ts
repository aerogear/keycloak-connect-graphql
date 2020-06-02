import test from 'ava'
import sinon from 'sinon'

import { GraphQLSchema } from 'graphql'
import { VisitableSchemaType } from '@graphql-tools/utils'
import { AuthDirective } from '../src/directives/schemaDirectiveVisitors'

import { KeycloakContext, GrantedRequest } from '../src/KeycloakContext'

const createHasRoleDirective = () => {
  return new AuthDirective({
    name: 'testAuthDirective',
    args: {},
    visitedType: ({} as VisitableSchemaType),
    schema: ({} as GraphQLSchema),
    context: []
  })
}

test('happy path: context.kauth.isAuthenticated() is called, then original resolver is called', async (t) => {
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
  } as GrantedRequest

  const context = {
    request: req,
    kauth: new KeycloakContext({ req })
  }

  const isAuthenticatedSpy = sinon.spy(context.kauth, 'isAuthenticated')

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
  
  t.truthy(isAuthenticatedSpy.called)
  t.truthy(resolverSpy.called)
})

test('context.kauth.isAuthenticated() is called, even if field has no resolver', async (t) => {
  const directive = createHasRoleDirective()

  const field = {
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
  } as GrantedRequest

  const context = {
    request: req,
    kauth: new KeycloakContext({ req })
  }

  const isAuthenticatedSpy = sinon.spy(context.kauth, 'isAuthenticated')

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  //@ts-ignore
  await field.resolve(root, args, context, info)
  
  t.truthy(isAuthenticatedSpy.called)
})

test('resolver will throw if context.kauth is not present', async (t) => {
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
  } as GrantedRequest

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

test('resolver will throw if context.kauth present but context.kauth.isAuthenticated returns false', async (t) => {
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
  const req = {} as GrantedRequest

  const context = {
    request: req,
    kauth: {
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