import test from 'ava'
import Keycloak from 'keycloak-connect'

import { KeycloakContext, KeycloakContextBase, KeycloakSubscriptionContext, GrantedRequest } from '../src/KeycloakContext'

test('KeycloakContextBase accessToken is the access_token in req.kauth', (t) => {
  const token = {
    hasRole: (role: string) => {
      return true
    },
    isExpired: () => {
      return false
    }
  } as Keycloak.Token

  const provider = new KeycloakContextBase(token)
  t.deepEqual(provider.accessToken, token)
})

test('KeycloakSubscriptionContext accessToken is the access_token in req.kauth', (t) => {

  const token = {
    hasRole: (role: string) => {
      return true
    },
    isExpired: () => {
      return false
    }
  } as Keycloak.Token

  const provider = new KeycloakSubscriptionContext(token)
  t.deepEqual(provider.accessToken, token)
})

test('KeycloakContext accessToken is the access_token in req.kauth', (t) => {

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
  } as GrantedRequest

  const provider = new KeycloakContext({ req })
  const token = req.kauth.grant && req.kauth.grant.access_token ? req.kauth.grant.access_token : undefined
  t.deepEqual(provider.accessToken, token)
})

test('KeycloakContext hasRole calls hasRole in the access_token', (t) => {
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
  } as GrantedRequest

  const provider = new KeycloakContext({ req })
  t.truthy(provider.hasRole(''))
})

test('KeycloakContext.isAuthenticated is true when token is defined and isExpired returns false', (t) => {
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
  } as GrantedRequest

  const provider = new KeycloakContext({ req })
  t.truthy(provider.isAuthenticated())
})

test('KeycloakContext.isAuthenticated is false when token is defined but isExpired returns true', (t) => {
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
  } as GrantedRequest

  const provider = new KeycloakContext({ req })
  t.false(provider.isAuthenticated())
})

test('KeycloakContext.hasRole is false if token is expired', (t) => {
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
  } as GrantedRequest

  const provider = new KeycloakContext({ req })
  t.false(provider.hasRole(''))
})