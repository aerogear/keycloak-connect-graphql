import Keycloak from '../KeycloakTypings'

export interface KeycloakSubscriptionHandlerOptions {
  
  /**
   * The initialized keycloak object from keycloak-connect
   */
  keycloak: Keycloak.Keycloak,

  /**
   * If true, then all subscriptions must be authenticated. 
   * Clients that do not supply the correct connectionParams will be blocked
   * 
   * If false, then the connectionParams will still be parsed and validated
   * but unauthenticated clients (i.e. no connectionParams) will not be immediately blocked.
   * This means it can be decided on an individual subscription level.
   * Allowing for publicly and non publicly accessible subscriptions
   * 
   */
  protect?: boolean
}
