import test from 'ava'

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
  }

  const provider = new KeycloakContext({ req })
  t.deepEqual(provider.accessToken, req.kauth.grant.access_token)
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
  }

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
  }

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
  }

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
  }

  const provider = new KeycloakContext({ req })
  t.false(provider.hasRole(''))
})