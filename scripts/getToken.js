const tokenRequester = require('keycloak-request-token')

const baseUrl = 'http://localhost:8080/auth';
const settings = {
    username: 'developer',
    password: 'developer',
    grant_type: 'password',
    client_id: 'voyager-testing-public',
    realmName: 'voyager-testing'
}

tokenRequester(baseUrl, settings)
  .then((token) => {
    const headers = {
      Authorization: `Bearer ${token}`, clientId: settings.client_id
    }
    console.log(JSON.stringify(headers))
  }).catch((err) => {
    console.log('err', err)
  })