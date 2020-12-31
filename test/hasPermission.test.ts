import test from 'ava'
import sinon from 'sinon'

import { GraphQLSchema } from 'graphql'
import { VisitableSchemaType } from '@graphql-tools/utils'
import { HasPermissionDirective } from '../src/directives/schemaDirectiveVisitors'
import { KeycloakContext, GrantedRequest } from '../src/KeycloakContext'
import Keycloak, { AuthZRequest, Grant } from 'keycloak-connect'

import * as express from 'express'
import { AuthorizationConfiguration } from '../src/KeycloakPermissionsHandler'

const createHasPermissionDirective = (directiveArgs: any) => {
  return new HasPermissionDirective({
    name: 'testHasPermissionDirective',
    args: directiveArgs,
    visitedType: ({} as VisitableSchemaType),
    schema: ({} as GraphQLSchema),
    context: []
  })
}

test('context.auth.hasPermission() is called', async (t) => {
  t.plan(1)
  const directiveArgs = {
    resources: 'Artical'
  }

  const directive = createHasPermissionDirective(directiveArgs)

  const field = {
    resolve: (root: any, args: any, context: any, info: any) => {
      t.pass()
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const keycloak = {
    checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
        return new Promise<Grant>((resolve, reject) => {
            const result = {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean => {
                        return true
                    }
                }
            } as unknown as Grant
            return resolve(result)
        })
      }
    } as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean => {
                        return false
                    },
                    isExpired: () => {
                        return false
                    }
                }
            }
        }
    } as unknown as GrantedRequest

    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration
  
    const context = {
        request: req,
        kauth: new KeycloakContext({ req }, keycloak, config)
    }

    const info = {
        parentType: {
            name: 'testParent'
        }
    }
  
    await field.resolve(root, args, context, info)
})

test('hasPermission works on fields that have no resolvers. context.auth.hasPermission() is called', async (t) => {
    t.plan(1)
    const directiveArgs = {
        resources: 'Article:view'
    }

    const directive = createHasPermissionDirective(directiveArgs)
    const field = {
        name: 'testField'
    }

    directive.visitFieldDefinition(field)

    const root = {}
    const args = {}
    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return true
                        }
                    }
                } as unknown as Grant
                return resolve(result)
            })
          }
    } as Keycloak.Keycloak

    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration

    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean => {
                        t.pass()
                        return true
                    },
                    isExpired: () => {
                        return false
                    }
                }
            }
        }
    } as unknown as GrantedRequest

    const context = {
        request: req,
        kauth: new KeycloakContext({ req }, keycloak, config)
    }

    const info = {
        parentType: {
            name: 'testParent'
        }
    }

    //@ts-ignore
    await field.resolve(root, args, context, info)
})

test('visitFieldDefinition accepts an array of permissions', async (t) => {
    t.plan(2)
    const directiveArgs = {
        resources: ['Article:view', 'Article:write', 'Article:delete']
    }

    const directive = createHasPermissionDirective(directiveArgs)

    const field = {
        resolve: (root: any, args: any, context: any, info: any) => {
            t.pass()
        },
        name: 'testField'
    }

    directive.visitFieldDefinition(field)

    const root = {}
    const args = {}
    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return true
                        }
                    }
                } as unknown as Grant
                return resolve(result)
            })
        }
    } as Keycloak.Keycloak

    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration

    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean => {
                        t.pass()
                        return r === 'Article' && s === 'write'
                    },
                    isExpired: () => {
                        return false
                    }
                }
            }
        }
    } as unknown as GrantedRequest
  
    const context = {
        request: req,
        kauth: new KeycloakContext({ req }, keycloak, config)
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
        resources: 'Article'
    }

    const directive = createHasPermissionDirective(directiveArgs)
    
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
    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return true
                        }
                    }
                } as unknown as Grant
                return resolve(result)
            })
        }
    } as Keycloak.Keycloak

    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration
    
    const req = {} as GrantedRequest
    const context = {
        request: req,
        kauth: new KeycloakContext({ req }, keycloak, config)
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

test('if token does not have the required permission, then an error is returned and the original resolver will not execute', async (t) => {
    const directiveArgs = {
        resources: 'Article:view'
    }

    const directive = createHasPermissionDirective(directiveArgs)

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

    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return true
                        }
                    }
                } as unknown as Grant
                return resolve(result)
            })
        }
    } as Keycloak.Keycloak

    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration
        
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (resources: string) => {
                        t.deepEqual(resources, directiveArgs.resources)
                        return false
                    },
                    isExpired: () => {
                        return false
                    }
                }
            }
        }
    } as unknown as GrantedRequest

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
    }, `User is not authorized. Must have the following permissions: [${directiveArgs.resources}]`)
})

test('hasPermission does not allow unknown arguments, visitFieldDefinition will throw', async (t) => {
    const directiveArgs = {
        resources: 'Article:view',
        some: 'unknown arg'
    }

    const directive = createHasPermissionDirective(directiveArgs)

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

test('hasPermission does not allow a non string value for resources, visitFieldDefinition will throw', async (t) => {
    const directiveArgs = {
        resources: 123
    }

    const directive = createHasPermissionDirective(directiveArgs)

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

test('hasPermission must contain resources arg, visitFieldDefinition will throw', async (t) => {
    const directiveArgs = {}

    const directive = createHasPermissionDirective(directiveArgs)

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

test('hasPermission resources arg can be an array, visitFieldDefinition will not throw', async (t) => {
    const directiveArgs = {
        resources: ['Article:view', 'Blog']
    }

    const directive = createHasPermissionDirective(directiveArgs)
    
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