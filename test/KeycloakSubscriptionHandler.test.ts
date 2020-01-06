import test from 'ava'
import Keycloak from '../src/KeycloakTypings'

import { KeycloakSubscriptionHandler } from '../src/KeycloakSubscriptionHandler'
import { Token } from './utils/KeycloakToken';

const TEST_CLIENT_ID = 'voyager-testing'

test('onSubscriptionConnect throws if no keycloak provided', async t => {
  t.throws(() => {
    //@ts-ignore
    new KeycloakSubscriptionHandler()
  }, 'missing keycloak instance in options')
})

test('onSubscriptionConnect throws if no connectionParams Provided', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })

  await t.throwsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(null, {}, {})
  }, 'Access Denied - missing connection parameters for Authentication')
})

test('onSubscriptionConnect throws if no connectionParams is not an object', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = 'not an object'

  await t.throwsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  }, 'Access Denied - missing connection parameters for Authentication')
})

test('onSubscriptionConnect throws if no Auth provided', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: undefined }

  await t.throwsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  }, 'Access Denied - missing Authorization field in connection parameters')
})

test('onSubscriptionConnect throws if "Authorization" field is not formed correctly', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: '1234' }

  await t.throwsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  }, 'Access Denied - Error: Invalid Authorization field in connection params. Must be in the format "Authorization": "Bearer <token string>"')
})

test('onSubscriptionConnect returns a token Object if the keycloak library considers it valid', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJjN2UyMzA0NS00NGVmLTQ1ZDItOGY0Yy1jODA4OTlhYzljYzIiLCJleHAiOjE1NTc5NjcxMjQsIm5iZiI6MCwiaWF0IjoxNTU3OTMxMTI0LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxMTI0LCJzZXNzaW9uX3N0YXRlIjoiOThiNTM2ODAtODU5MC00MzFmLWFiNzctMDY0MDFmODgzYTY5IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.iF3WdY6hwlZIX2bq40fs0GhxG991TqtBEuKbX7A8DMfgOj2QFDyNHGLVzEiJqMal44pmhlWhtOSoVp77ZZ57HdatEYqYaTnc8C8ajA8A1yxOX81D0lFu2jmC3WpKS2H0prrjdPPZyf82YpbYuwYAyiKJMpJSiRC2fGk1Owsg9O6CSj8cFbKfrS4msE1Y90S84qwrDfRYFSFFdsmeTvC71qyj4ZhNqNfPWbIwymlnYJ6xYbmTrZBv2GktXBLd0BnSu5QFoHgjiCxG3cyFV4tCIBpvWjebI6rCUehD6TTIXiW4uVOp9YPWvyZH8WznFdtq36CDb51abWJ8EUquog7M1w'

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString }

  const token = await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  t.truthy(token)
  //@ts-ignore
  t.truthy(token.content)
})

test('onSubscriptionConnect can also parse the token with lowercase \'bearer\'', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const tokenString = 'bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJjN2UyMzA0NS00NGVmLTQ1ZDItOGY0Yy1jODA4OTlhYzljYzIiLCJleHAiOjE1NTc5NjcxMjQsIm5iZiI6MCwiaWF0IjoxNTU3OTMxMTI0LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxMTI0LCJzZXNzaW9uX3N0YXRlIjoiOThiNTM2ODAtODU5MC00MzFmLWFiNzctMDY0MDFmODgzYTY5IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.iF3WdY6hwlZIX2bq40fs0GhxG991TqtBEuKbX7A8DMfgOj2QFDyNHGLVzEiJqMal44pmhlWhtOSoVp77ZZ57HdatEYqYaTnc8C8ajA8A1yxOX81D0lFu2jmC3WpKS2H0prrjdPPZyf82YpbYuwYAyiKJMpJSiRC2fGk1Owsg9O6CSj8cFbKfrS4msE1Y90S84qwrDfRYFSFFdsmeTvC71qyj4ZhNqNfPWbIwymlnYJ6xYbmTrZBv2GktXBLd0BnSu5QFoHgjiCxG3cyFV4tCIBpvWjebI6rCUehD6TTIXiW4uVOp9YPWvyZH8WznFdtq36CDb51abWJ8EUquog7M1w'

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString }

  const token = await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  
  t.truthy(token)
  //@ts-ignore
  t.truthy(token.content)
})

test('the token object will have hasRole function if grant is successfully created', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        console.log(`createGant called with token String ${tokenString}`)
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  // hardcoded token object that can be used for quick unit testing
  // works with a clientId called 'voyager-testing' and has a client role 'tester'
  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJmMWZjZDdmNS1mMWM0LTQyYWQtYjFmOC00ZWVhNzNiZWU2N2MiLCJleHAiOjE1NTc5Njc4MzksIm5iZiI6MCwiaWF0IjoxNTU3OTMxODM5LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxODM5LCJzZXNzaW9uX3N0YXRlIjoiMDQ2YTk4N2QtNmI4NS00Njk5LTllNmUtNGIyYmVlYzBhYzNhIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InZveWFnZXItdGVzdGluZyI6eyJyb2xlcyI6WyJ0ZXN0ZXIiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.YjmImGZbs5-s0K1KEYnIedW3peIUz4rORoOUTNFgE2sEKHe2hvvDg48NNybVsJDZc29Al-6OiUw8En5GpschqHHb79GqStEtuJ5T2UZb5sC2B7sX1jAvZAafkxCcOMajEbgS5qVPGoFhDTTej06sGfQwI8h0Igwle86O8IDMbEK-uN_oVa1xKTrFtvsFKekS3Yz3_qSVlmAhOKyYejEg8hkZOvJzHXK9_zsi3Ze6MLq2VCSJE-13UnZuSvdD36FydJQXkZ7elKYqj_HcyPIMAkBuKPhYAXZ9laMo2X4wM6gSIFZXKPeG44eUAGH7estqeG2oXNsdbPaixoNFHHuMqA'

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString, clientId: 'voyager-testing' }

  const token = await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  t.truthy(token)
  //@ts-ignore
  t.truthy(token.hasRole('tester'))
})

test('If grant creation fails then onSubscriptionConnect will throw', async t => {
  const errorMsg = 'token is invalid'
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return new Promise((resolve, reject) => {
          reject(new Error(errorMsg))
        })
      }
    }
  } as unknown as Keycloak.Keycloak

  // hardcoded token object that can be used for quick unit testing
  // works with a clientId called 'voyager-testing' and has a client role 'tester'
  const tokenString = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfa29BTUtBcW1xQjcxazNGeDdBQ0xvNXZqMXNoWVZwSkdJM2FScFl4allZIn0.eyJqdGkiOiJmMWZjZDdmNS1mMWM0LTQyYWQtYjFmOC00ZWVhNzNiZWU2N2MiLCJleHAiOjE1NTc5Njc4MzksIm5iZiI6MCwiaWF0IjoxNTU3OTMxODM5LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvdm95YWdlci10ZXN0aW5nIiwiYXVkIjoidm95YWdlci10ZXN0aW5nIiwic3ViIjoiM2Y4MDRiNWEtM2U3Ni00YzI2LTk4ZTYtNDU1ZDNlMzUzZmY3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidm95YWdlci10ZXN0aW5nIiwiYXV0aF90aW1lIjoxNTU3OTMxODM5LCJzZXNzaW9uX3N0YXRlIjoiMDQ2YTk4N2QtNmI4NS00Njk5LTllNmUtNGIyYmVlYzBhYzNhIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InZveWFnZXItdGVzdGluZyI6eyJyb2xlcyI6WyJ0ZXN0ZXIiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInByZWZlcnJlZF91c2VybmFtZSI6ImRldmVsb3BlciJ9.YjmImGZbs5-s0K1KEYnIedW3peIUz4rORoOUTNFgE2sEKHe2hvvDg48NNybVsJDZc29Al-6OiUw8En5GpschqHHb79GqStEtuJ5T2UZb5sC2B7sX1jAvZAafkxCcOMajEbgS5qVPGoFhDTTej06sGfQwI8h0Igwle86O8IDMbEK-uN_oVa1xKTrFtvsFKekS3Yz3_qSVlmAhOKyYejEg8hkZOvJzHXK9_zsi3Ze6MLq2VCSJE-13UnZuSvdD36FydJQXkZ7elKYqj_HcyPIMAkBuKPhYAXZ9laMo2X4wM6gSIFZXKPeG44eUAGH7estqeG2oXNsdbPaixoNFHHuMqA'

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak })
  const connectionParams = { Authorization: tokenString, clientId: 'voyager-testing' }

  await t.throwsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  }, `Access Denied - ${new Error(errorMsg)}`)  
})

test('onSubscriptionConnect with {protect: false} does not throw if no connectionParams Provided', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak, protect: false })

  await t.notThrowsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(null, {}, {})
  })
})

test('onSubscriptionConnect with {protect: false} does not throw if connectionParams is not an object', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak, protect: false })
  const connectionParams = 'not an object'

  await t.notThrowsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  })
})

test('onSubscriptionConnect with {protect: false} does not throw if no Auth provided', async t => {
  const stubKeycloak = {
    grantManager: {
      createGrant: (token: any) => {
        return { access_token: new Token(token.access_token, TEST_CLIENT_ID)}
      }
    }
  } as unknown as Keycloak.Keycloak

  const subscriptionHandler = new KeycloakSubscriptionHandler({ keycloak: stubKeycloak, protect: false })
  const connectionParams = { Authorization: undefined }

  await t.notThrowsAsync(async () => {
    await subscriptionHandler.onSubscriptionConnect(connectionParams, {}, {})
  })
})