import { AuthContextProvider } from './api'
import Keycloak from 'keycloak-connect'

export class KeycloakContext implements AuthContextProvider {
  public readonly request: Keycloak.GrantedRequest
  public readonly accessToken: Keycloak.Token | undefined

  constructor ({ req }: { req: Keycloak.GrantedRequest }) {
    this.request = req
    this.accessToken = (req && req.kauth && req.kauth.grant) ? req.kauth.grant.access_token : undefined
  }

  public isAuthenticated (): boolean {
    return (this.accessToken && !this.accessToken.isExpired()) ? true : false 
  }

  public hasRole (role: string): boolean {
    //@ts-ignore
    return this.isAuthenticated() && this.accessToken.hasRole(role)
  }
}
