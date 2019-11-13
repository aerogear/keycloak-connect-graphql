const tokenRequester = require('keycloak-request-token')

const username = process.argv[2]
const password = process.argv[3]

const baseUrl = 'http://localhost:8080/auth';
const settings = {
    username: username || 'developer',
    password: password || 'developer',
    grant_type: 'password',
    client_id: 'keycloak-connect-graphql-public',
    realmName: 'keycloak-connect-graphql'
}

tokenRequester(baseUrl, settings)
  .then((token) => {
    const headers = {
      Authorization: `Bearer ${token}`
    }
    console.log(JSON.stringify(headers))
  }).catch((err) => {
    console.log('err', err)
  })