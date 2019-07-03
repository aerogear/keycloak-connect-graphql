import test from 'ava'

import { KeycloakSecurityService } from '../src/KeycloakSecurityService'
import { Token } from '../src/KeycloakToken';

test('onSubscriptionConnect throws if no connectionParams Provided', async t => {
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          resolve(true)
        })
      }
    }
  }

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })

  await t.throwsAsync(async () => {
    await securityService.onSubscriptionConnect(null, {}, {})
  }, 'Access Denied - missing connection parameters for Authentication')
})

test('onSubscriptionConnect throws if no connectionParams is not an object', async t => {
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          resolve(true)
        })
      }
    }
  }

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })
  const connectionParams = 'not an object'

  await t.throwsAsync(async () => {
    await securityService.onSubscriptionConnect(connectionParams, {}, {})
  }, 'Access Denied - missing connection parameters for Authentication')
})

test('onSubscriptionConnect throws if no Auth provided', async t => {
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          resolve(true)
        })
      }
    }
  }

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })
  const connectionParams = { Authorization: undefined }

  await t.throwsAsync(async () => {
    await securityService.onSubscriptionConnect(connectionParams, {}, {})
  }, 'Access Denied - missing Authorization field in connection parameters')
})

test('onSubscriptionConnect returns a token Object if the keycloak library considers it valid', async t => {
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          resolve(true)
        })
      }
    }
  }

  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJjN2UyMzA0NS00NGVmLTQ1ZDItOGY0Yy1jODA4OTlhYzljYzIiLCJleHAiOjE1NTc5NjcxMjQsIm5iZiI6MCwiaWF0IjoxNTU3OTMxMTI0LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxMTI0LCJzZXNzaW9uX3N0YXRlIjoiOThiNTM2ODAtODU5MC00MzFmLWFiNzctMDY0MDFmODgzYTY5IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.iF3WdY6hwlZIX2bq40fs0GhxG991TqtBEuKbX7A8DMfgOj2QFDyNHGLVzEiJqMal44pmhlWhtOSoVp77ZZ57HdatEYqYaTnc8C8ajA8A1yxOX81D0lFu2jmC3WpKS2H0prrjdPPZyf82YpbYuwYAyiKJMpJSiRC2fGk1Owsg9O6CSj8cFbKfrS4msE1Y90S84qwrDfRYFSFFdsmeTvC71qyj4ZhNqNfPWbIwymlnYJ6xYbmTrZBv2GktXBLd0BnSu5QFoHgjiCxG3cyFV4tCIBpvWjebI6rCUehD6TTIXiW4uVOp9YPWvyZH8WznFdtq36CDb51abWJ8EUquog7M1w'

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString }

  const token = await securityService.onSubscriptionConnect(connectionParams, {}, {})
  t.truthy(token instanceof Token)
})

test('the token object will have hasRole, hasRealmRole and hasPermissions if the', async t => {
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          resolve(true)
        })
      }
    }
  }

  // hardcoded token object that can be used for quick unit testing
  // works with a clientId called 'voyager-testing' and has a client role 'tester'
  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJmMWZjZDdmNS1mMWM0LTQyYWQtYjFmOC00ZWVhNzNiZWU2N2MiLCJleHAiOjE1NTc5Njc4MzksIm5iZiI6MCwiaWF0IjoxNTU3OTMxODM5LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxODM5LCJzZXNzaW9uX3N0YXRlIjoiMDQ2YTk4N2QtNmI4NS00Njk5LTllNmUtNGIyYmVlYzBhYzNhIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InZveWFnZXItdGVzdGluZyI6eyJyb2xlcyI6WyJ0ZXN0ZXIiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.YjmImGZbs5-s0K1KEYnIedW3peIUz4rORoOUTNFgE2sEKHe2hvvDg48NNybVsJDZc29Al-6OiUw8En5GpschqHHb79GqStEtuJ5T2UZb5sC2B7sX1jAvZAafkxCcOMajEbgS5qVPGoFhDTTej06sGfQwI8h0Igwle86O8IDMbEK-uN_oVa1xKTrFtvsFKekS3Yz3_qSVlmAhOKyYejEg8hkZOvJzHXK9_zsi3Ze6MLq2VCSJE-13UnZuSvdD36FydJQXkZ7elKYqj_HcyPIMAkBuKPhYAXZ9laMo2X4wM6gSIFZXKPeG44eUAGH7estqeG2oXNsdbPaixoNFHHuMqA'

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString, clientId: 'voyager-testing' }

  const token: Token = await securityService.onSubscriptionConnect(connectionParams, {}, {})
  t.truthy(token instanceof Token)
  t.truthy(token.hasRole('tester'))
})

test('If the keycloak token validation fails, then onSubscriptionConnect will throw', async t => {
  const errorMsg = 'token is invalid'
  const stubKeycloak = {
    grantManager: {
      validateToken: (token: string, type: 'string') => {
        return new Promise((resolve, reject) => {
          reject(new Error(errorMsg))
        })
      }
    }
  }

  // hardcoded token object that can be used for quick unit testing
  // works with a clientId called 'voyager-testing' and has a client role 'tester'
  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJmMWZjZDdmNS1mMWM0LTQyYWQtYjFmOC00ZWVhNzNiZWU2N2MiLCJleHAiOjE1NTc5Njc4MzksIm5iZiI6MCwiaWF0IjoxNTU3OTMxODM5LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxODM5LCJzZXNzaW9uX3N0YXRlIjoiMDQ2YTk4N2QtNmI4NS00Njk5LTllNmUtNGIyYmVlYzBhYzNhIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InZveWFnZXItdGVzdGluZyI6eyJyb2xlcyI6WyJ0ZXN0ZXIiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.YjmImGZbs5-s0K1KEYnIedW3peIUz4rORoOUTNFgE2sEKHe2hvvDg48NNybVsJDZc29Al-6OiUw8En5GpschqHHb79GqStEtuJ5T2UZb5sC2B7sX1jAvZAafkxCcOMajEbgS5qVPGoFhDTTej06sGfQwI8h0Igwle86O8IDMbEK-uN_oVa1xKTrFtvsFKekS3Yz3_qSVlmAhOKyYejEg8hkZOvJzHXK9_zsi3Ze6MLq2VCSJE-13UnZuSvdD36FydJQXkZ7elKYqj_HcyPIMAkBuKPhYAXZ9laMo2X4wM6gSIFZXKPeG44eUAGH7estqeG2oXNsdbPaixoNFHHuMqA'

  const securityService = new KeycloakSecurityService({}, { log: console, keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString, clientId: 'voyager-testing' }

  await t.throwsAsync(async () => {
    await securityService.onSubscriptionConnect(connectionParams, {}, {})
  }, `Access Denied - ${new Error(errorMsg)}`)  
})