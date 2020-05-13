import test from 'ava'
import { isAuthorizedByRole } from '../src/directives/utils'
import Keycloak from 'keycloak-connect'
import { KeycloakContextBase } from '../src/KeycloakContext'

test('isAuthorizedByRole returns the result of token.hasRole', (t) => {
  t.plan(4)
  const token = {
    hasRole: (role: string) => {
      t.pass()
      return role === 'c'
    },
    isExpired: () => {
      return false
    }
  } as Keycloak.Token

  const context = { kauth: new KeycloakContextBase(token) } 
  
  t.truthy(isAuthorizedByRole(['a', 'b', 'c'], context))
})

test('isAuthorizedByRole returns false if hasRole returns false', (t) => {
  t.plan(4)
  const token = {
    hasRole: (role: string) => {
      t.pass()
      return false
    },
    isExpired: () => {
      return false
    }
  } as Keycloak.Token

  const context = { kauth: new KeycloakContextBase(token) } 
  
  t.falsy(isAuthorizedByRole(['a', 'b', 'c'], context))
})

test('isAuthorizedByRole returns false if context is empty', (t) => {
  const context = { } 
  t.falsy(isAuthorizedByRole(['a', 'b', 'c'], context))
})

test('isAuthorizedByRole returns false if context undefined', (t) => {
  const context = { } 
  t.falsy(isAuthorizedByRole(['a', 'b', 'c'], undefined))
})