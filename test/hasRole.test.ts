import test from 'ava'
import sinon from 'sinon'

import { GraphQLSchema } from 'graphql'
import { VisitableSchemaType } from '@graphql-tools/utils'
import { HasRoleDirective } from '../src/directives/schemaDirectiveVisitors'
import { KeycloakContext, GrantedRequest } from '../src/KeycloakContext'

const createHasRoleDirective = (directiveArgs: any) => {
  return new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs,
    visitedType: ({} as VisitableSchemaType),
    schema: ({} as GraphQLSchema),
    context: []
  })
}

test('context.auth.hasRole() is called', async (t) => {
  t.plan(3)
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
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
          hasRole: (role: string) => {
            t.pass()
            t.deepEqual(role, directiveArgs.role)
            return true
          },
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

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
})

test('hasRole works on fields that have no resolvers. context.auth.hasRole() is called', async (t) => {
  t.plan(2)
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

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
          hasRole: (role: string) => {
            t.pass()
            t.deepEqual(role, directiveArgs.role)
            return true
          },
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

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  //@ts-ignore
  await field.resolve(root, args, context, info)
})

test('visitFieldDefinition accepts an array of roles', async (t) => {
  t.plan(4)
  const directiveArgs = {
    role: ['foo', 'bar', 'baz']
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
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
          hasRole: (role: string) => {
            t.pass()
            return (role === 'baz') // this makes sure it doesn't return true instantly
          },
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

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
})

test('if there is no authentication, then an error is returned and the original resolver will not execute', async (t) => {
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {} as GrantedRequest
  const context = {
    request: req,
    kauth: new KeycloakContext({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, `User not Authenticated`)
})

test('if token does not have the required role, then an error is returned and the original resolver will not execute', async (t) => {
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    }
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            t.deepEqual(role, directiveArgs.role)
            return false
          },
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

  const info = {
    fieldName: 'testField',
    parentType: {
      name: 'testParent'
    }
  }

  await t.throwsAsync(async () => {
    await field.resolve(root, args, context, info)
  }, `User is not authorized. Must have one of the following roles: [${directiveArgs.role}]`)
})

test('hasRole does not allow unkown arguments, visitFieldDefinition will throw', async (t) => {
  const directiveArgs = {
    role: 'admin',
    some: 'unknown arg'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called')
      })
    },
    name: 'testField'
  }

  t.throws(() => {
    directive.visitFieldDefinition(field)
  })
})

test('hasRole does not allow a non string value for role, visitFieldDefinition will throw', async (t) => {
  const directiveArgs = {
    role: 123
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called')
      })
    },
    name: 'testField'
  }

  t.throws(() => {
    directive.visitFieldDefinition(field)
  })
})

test('hasRole must contain role arg, visitFieldDefinition will throw', async (t) => {
  const directiveArgs = {}

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called')
      })
    },
    name: 'testField'
  }

  t.throws(() => {
    directive.visitFieldDefinition(field)
  })
})

test('hasRole role arg can be an array, visitFieldDefinition will not throw', async (t) => {
  const directiveArgs = {
    role: ['admin', 'developer']
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called')
      })
    },
    name: 'testField'
  }

  t.notThrows(() => {
    directive.visitFieldDefinition(field)
  })
})

test('hasRole role arg can be an array, non string values will be converted, visitFieldDefinition will not throw', async (t) => {
  t.plan(1)
  const directiveArgs = {
    role: ['admin', 1, 1.234]
  }

  const expectedValue = ['admin', '1', '1.234']

  
  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {},
    name: 'testField'
  }

  const validateSpy = sinon.spy(directive, 'parseAndValidateArgs')
  
  directive.visitFieldDefinition(field)

  t.deepEqual(expectedValue, validateSpy.returnValues[0])
})

test('context.auth.hasRole() works even if request is not supplied in context', async (t) => {
  t.plan(3)
  const directiveArgs = {
    role: 'admin'
  }

  const directive = createHasRoleDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
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
          hasRole: (role: string) => {
            t.pass()
            t.deepEqual(role, directiveArgs.role)
            return true
          },
          isExpired: () => {
            return false
          }
        }
      }
    }
  } as GrantedRequest

  const context = {
    kauth: new KeycloakContext({ req })
  }

  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await field.resolve(root, args, context, info)
})
