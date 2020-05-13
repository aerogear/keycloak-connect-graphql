import { CONTEXT_KEY } from '../KeycloakContext'

/**
 * 
 * @param roles the list of roles the user should match against
 * @param context the graphql context that contains the user info
 */
export function isAuthorizedByRole(roles: string[], context?: any) {
  if (!(context && context[CONTEXT_KEY])) {
    console.error(`context.${CONTEXT_KEY} is missing. Keycloak integration is probably misconfigured`)  
    return false
  }

  for (const role of roles) {
    if (context[CONTEXT_KEY].hasRole(role)) {
      return true
    }
  }

  return false
}