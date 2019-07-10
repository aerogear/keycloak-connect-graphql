import test from 'ava'
import Keycloak from 'keycloak-connect'

import { KeycloakContext } from '../src/KeycloakContext'

test('AuthContextProvider accessToken is the access_token in req.kauth', (t) => {

  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            return true
          },
          isExpired: () => {
            return false
          }
        }
      }
    }
  } as Keycloak.GrantedRequest

  const provider = new KeycloakContext({ req })
  const token = req.kauth.grant && req.kauth.grant.access_token ? req.kauth.grant.access_token : undefined
  t.deepEqual(provider.accessToken, token)
})

test('AuthContextProvider hasRole calls hasRole in the access_token', (t) => {
  t.plan(2)
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            t.pass()
            return true
          },
          isExpired: () => {
            return false
          }
        }
      }
    }
  } as Keycloak.GrantedRequest

  const provider = new KeycloakContext({ req })
  t.truthy(provider.hasRole(''))
})

test('AuthContextProvider.isAuthenticated is true when token is defined and isExpired returns false', (t) => {
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            return true
          },
          isExpired: () => {
            return false
          }
        }
      }
    }
  } as Keycloak.GrantedRequest

  const provider = new KeycloakContext({ req })
  t.truthy(provider.isAuthenticated())
})

test('AuthContextProvider.isAuthenticated is false when token is defined but isExpired returns true', (t) => {
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            return true
          },
          isExpired: () => {
            return true
          }
        }
      }
    }
  } as Keycloak.GrantedRequest

  const provider = new KeycloakContext({ req })
  t.false(provider.isAuthenticated())
})

test('AuthContextProvider.hasRole is false if token is expired', (t) => {
  const req = {
    kauth: {
      grant: {
        access_token: {
          hasRole: (role: string) => {
            return true
          },
          isExpired: () => {
            return true
          }
        }
      }
    }
  } as Keycloak.GrantedRequest

  const provider = new KeycloakContext({ req })
  t.false(provider.hasRole(''))
})