import test from 'ava'
import Keycloak, { AuthZRequest, Grant, KeycloakConfig } from 'keycloak-connect'
import { GrantedRequest } from '../src/KeycloakContext'
import * as express from 'express'

import { AuthorizationConfiguration, KeycloakPermissionsHandler } from '../src/KeycloakPermissionsHandler'

test('KeycloakPermissionsHandler.hasPermissions returns false when there is no kauth', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await handler.hasPermission('Article:view'), false)
})

test('KeycloakPermissionsHandler.hasPermissions returns false when there is no kauth.grant', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
        }
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await handler.hasPermission('Article:view'), false)
})

test('KeycloakPermissionsHandler.hasPermissions returns false when there is no kauth.grant.access_token', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
            }
        }
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await handler.hasPermission('Article:view'), false)
})

test('KeycloakPermissionsHandler.hasPermissions returns true when resources is an empty array', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                }
            }
        }
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await handler.hasPermission([]), true)
})

test('KeycloakPermissionsHandler.hasPermissions returns true when expected resource and scope were matched', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && s === 'view'
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await handler.hasPermission('Article:view'), true)
})

test('KeycloakPermissionsHandler.hasPermissions returns true when expected resource and scope were found in array', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && s === 'view'
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await handler.hasPermission(['Article:view']), true)
})

test('KeycloakPermissionsHandler.hasPermissions returns false when expected resource was not found', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && s === 'view'
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await handler.hasPermission(['Article1:view']), false)
})


test('KeycloakPermissionsHandler.hasPermissions returns false when expected scope was not found', async (t) => {
    const keycloak = {
        getConfig: (): KeycloakConfig => {
            return {
                resource: 'resource-server'
            } as KeycloakConfig
        }
    } as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && s === 'view'
                    }
                }
            }
        }
    } as unknown as GrantedRequest

    const handler = new KeycloakPermissionsHandler(keycloak, req, undefined)
    t.deepEqual(await handler.hasPermission(['Article:view1']), false)
})

test('KeycloakPermissionsHandler.hasPermissions returns false when at least one resource and scope were not found', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && s === 'view'
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {
        resource_server_id: 'resource-server',
        claims: ()=> undefined
    } as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req , config)
    t.deepEqual(await handler.hasPermission(['Article:view', 'Article:delete']), false)
})

test('KeycloakPermissionsHandler.hasPermissions returns true when at all resource and scope were found', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean =>
                    {
                        return r === 'Article' && (s === 'view' || s === 'delete')
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await handler.hasPermission(['Article:view', 'Article:delete']), true)
})

test('KeycloakPermissionsHandler.hasPermissions uses claims defined in configuration when it asks keycloak to checkPermissions', async (t) => {
    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const actual = JSON.parse(Buffer.from(authzRequest.claim_token!, 'base64').toString())
                const hasAllClaims = actual['claim1'] === 'claim1' && actual['claim2'] === 'claim2'

                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return true
                        }
                    }
                } as unknown as Grant
                hasAllClaims ? resolve(result) : reject(result)
            })
        }
    } as Keycloak.Keycloak
    const req = {
        kauth: {
            grant: {
                access_token: {
                    hasPermission: (r: string, s: string | undefined): boolean => {
                        return false
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {
        resource_server_id: 'resource-server',
        claims: (request: GrantedRequest) => {
            return {
                claim1: 'claim1',
                claim2: 'claim2'
            }
        }
    } as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await handler.hasPermission(['Article:view', 'Article:delete']), true)
})


test('KeycloakPermissionsHandler.hasPermissions returns true when access token from authorization request returns true', async (t) => {
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
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req, config)
    t.deepEqual(await handler.hasPermission(['Article:view', 'Article:delete']), true)
})


test('KeycloakPermissionsHandler.hasPermissions returns false when access token from authorization request returns false', async (t) => {
    const keycloak = {
        checkPermissions(authzRequest: AuthZRequest, request: express.Request, callback?: (json: any) => any): Promise<Grant> {
            return new Promise<Grant>((resolve, reject) => {
                const result = {
                    access_token: {
                        hasPermission: (r: string, s: string | undefined): boolean => {
                            return false
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
                    }
                }
            }
        }
    } as unknown as GrantedRequest
    const config = {
        resource_server_id: 'resource-server'
    } as AuthorizationConfiguration

    const handler = new KeycloakPermissionsHandler(keycloak, req, config)
    t.deepEqual(await handler.hasPermission(['Article:view', 'Article:delete']), false)
})