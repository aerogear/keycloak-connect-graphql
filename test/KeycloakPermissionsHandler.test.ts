import test from 'ava'
import Keycloak from 'keycloak-connect'
import { GrantedRequest } from '../src/KeycloakContext'

import { AuthorizationConfiguration, KeycloakPermissionsHandler } from '../src/KeycloakPermissionsHandler'

test('KeycloakPermissionsHandler returns false when there is no token', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const provider = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await provider.hasPermission(""), false)
})

test('KeycloakPermissionsHandler returns true when resources is an empty array', async (t) => {
    const keycloak = {} as Keycloak.Keycloak
    const req = {
    } as GrantedRequest
    const config = {} as AuthorizationConfiguration

    const provider = new KeycloakPermissionsHandler(keycloak, req,  config)
    t.deepEqual(await provider.hasPermission([]), true)
})

test('KeycloakPermissionsHandler returns true when expected resource and scope were found', async (t) => {
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

    const provider = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await provider.hasPermission(['Article:view']), true)
})

test('KeycloakPermissionsHandler returns false when expected resource was not found', async (t) => {
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

    const provider = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await provider.hasPermission(['Article1:view']), false)
})


test('KeycloakPermissionsHandler returns false when expected scope was not found', async (t) => {
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

    const provider = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await provider.hasPermission(['Article:view1']), false)
})

test('KeycloakPermissionsHandler returns false when at least one resource and scope were not found', async (t) => {
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

    const provider = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await provider.hasPermission(['Article:view', 'Article:delete']), false)
})

test('KeycloakPermissionsHandler returns true when at all resource and scope were found', async (t) => {
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

    const provider = new KeycloakPermissionsHandler(keycloak, req ,  config)
    t.deepEqual(await provider.hasPermission(['Article:view', 'Article:delete']), true)
})