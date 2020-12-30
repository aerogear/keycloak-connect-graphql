import { Keycloak, Token, AuthZRequest } from 'keycloak-connect'
import { GrantedRequest } from './KeycloakContext'

export interface AuthorizationConfiguration {
    resource_server_id: string,
    response_mode: string,
    claims: (request: GrantedRequest)=>any
}

interface PermissionsToken extends Token {
    hasPermission(resource: string, scope: string | undefined): boolean
}

export class KeycloakPermissionsHandler {
    private permissionsToken: PermissionsToken | undefined
    constructor(private keycloak: Keycloak, private req: GrantedRequest, private config: AuthorizationConfiguration) {
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

        if (this.permissionsToken) {
            if (this.handlePermissions(expectedPermissions, (resource, scope) => {
                if (this.permissionsToken && this.permissionsToken.hasPermission(resource, scope)) {
                    return true
                }
                return false
            })) {
                return true
            }
        }

         let authzRequest: AuthZRequest = {
             audience: this.config.resource_server_id,
             response_mode: this.config.response_mode,
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

        if (this.config.claims) {
            const claims = this.config.claims(this.req)

            if (claims) {
                authzRequest.claim_token = Buffer.from(JSON.stringify(claims)).toString('base64')
                authzRequest.claim_token_format = 'urn:ietf:params:oauth:token-type:jwt'
            }
        }

        if (!this.config.response_mode || this.config.response_mode === 'permissions') {
            try {
                await this.keycloak.checkPermissions(authzRequest, this.req, (permissions: any) => {
                    if (this.handlePermissions(expectedPermissions, (resource: string, scope: string | undefined) => {
                        if (!permissions || permissions.length === 0) {
                            return false
                        }

                        for (let j = 0; j < permissions.length; j++) {
                            let permission = permissions[j]
                            
                            if (permission.rsid === resource || permission.rsname === resource) {
                                if (scope) {
                                    if (permission.scopes && permission.scopes.length > 0) {
                                        if (!permission.scopes.includes(scope)) {
                                            return false
                                        }
                                        break
                                    }
                                    return false
                                }
                            }
                        }
                        return true
                    })) {
                        return true
                    }

                    return false
                })

                return true
            } catch {
                return false
            }
        }

        if (this.config.response_mode === 'token') {
            try {
                authzRequest.response_mode = undefined
                await this.keycloak.checkPermissions(authzRequest, this.req).then((grant: any) => {
                    if (this.handlePermissions(expectedPermissions, (r, s) => {
                        if (!grant.access_token.hasPermission(r, s)) {
                            return false
                        }
                        return true
                    })) {
                        return true
                    }
                })
                return true
            } catch {
                return false
            }
        }

        return false
    }
}