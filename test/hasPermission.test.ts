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
        resources: ['Article:view']
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
