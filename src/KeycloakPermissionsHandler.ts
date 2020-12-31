import { Keycloak, Token, AuthZRequest } from 'keycloak-connect'
import { GrantedRequest } from './KeycloakContext'

/**
 * Provides hasPermission function to check if user has requested permissions.
 * 
 * Requests uma-ticket, retrieves user's permissions and checks if user has all requested permissions.
 */

export interface AuthorizationConfiguration {
    resource_server_id: string | undefined,
    claims: ((request: GrantedRequest)=>any) | undefined
}

interface PermissionsToken extends Token {
    hasPermission(resource: string, scope: string | undefined): boolean
}

export class KeycloakPermissionsHandler {
    private permissionsToken: PermissionsToken | undefined
    constructor(private keycloak: Keycloak, private req: GrantedRequest, private config: AuthorizationConfiguration | undefined) {
        this.permissionsToken = this.req?.kauth?.grant?.access_token as PermissionsToken
    }

    private handlePermissions(permissions: string[], handler: (r: string, s: string | undefined ) => boolean) {
        for (let i = 0; i < permissions.length; i++) {
            const expected = permissions[i].split(':')
            const resource = expected[0]
            let scope: string | undefined = undefined

            if (expected.length > 1) {
                scope = expected[1]
            }

            if (!handler(resource, scope)) {
                return false
            }
        }

        return true
    }

    async hasPermission(resources: string | string[]): Promise<boolean> {
        if (!this.permissionsToken) {
            return false
        }

        let expectedPermissions: string[];
        if (typeof resources === 'string') {
            expectedPermissions = [resources]
        } else {
            expectedPermissions = resources;
        }

        if (expectedPermissions.length === 0) {
            return true
        }

        // try with cached permissions
        if (this.handlePermissions(expectedPermissions, (resource, scope) => {
            if (this.permissionsToken && this.permissionsToken.hasPermission(resource, scope)) {
                return true
            }
            return false
        })) {
            return true
        }

        // make request
        let authzRequest: AuthZRequest = {
            audience: this.config?.resource_server_id ?? this.keycloak.getConfig().resource,
            permissions: new Array<{ id: string, scopes: string[] }>(),
        }

        this.handlePermissions(expectedPermissions, (resource, scope) => {
            const permissions = { id: resource, scopes: new Array<string>() }
            if (scope) {
                permissions.scopes = [scope]
            }

            authzRequest['permissions'].push(permissions)

            return true
        })

        if (this.config?.claims) {
            const claims = this.config.claims(this.req)

            if (claims) {
                authzRequest.claim_token = Buffer.from(JSON.stringify(claims)).toString('base64')
                authzRequest.claim_token_format = 'urn:ietf:params:oauth:token-type:jwt'
            }
        }

        try {
            authzRequest.response_mode = undefined
            const grant = await this.keycloak.checkPermissions(authzRequest, this.req)
            const token = grant.access_token as PermissionsToken;
            if (token && this.handlePermissions(expectedPermissions, (resource, scope) => {
                if (!token.hasPermission(resource, scope)) {
                    return false
                }
                return true
            })) {
                return true
            }

            return false
        } catch {
            return false
        }
    }
}