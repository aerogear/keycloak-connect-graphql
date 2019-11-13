const KeycloakAdmin = require('keycloak-admin').default

const realmExport = require('../examples/config/realm-export.json')

// The public and bearer clients that will be set up
const PUBLIC_CLIENT_NAME = `${realmExport.realm}-public`
const BEARER_CLIENT_NAME = `${realmExport.realm}-bearer`

// The client roles you want created for the bearer and public clients
const clientRoleNames = [
  'admin',
  'developer',
]

// The realm roles we want for the realm
const realmRoleNames = [
  'admin',
  'developer'
]

// The users to be created
// roles specified here will be added
// as realm roles and as client roles
// for both the public and bearer clients
const users = [
  {
    username: 'developer',
    password: 'developer',
    roles: [
      'developer'
    ]
  },
  {
    username: 'adminuser',
    password: 'admin',
    roles: [
      'admin'
    ]
  }
]

async function initKeycloak() {
  const kc = new KeycloakAdmin()

  await kc.auth({
    username: 'admin',
    password: 'admin',
    grantType: 'password',
    clientId: 'admin-cli',
  })

  await kc.realms.del({ realm: realmExport.realm }).catch((err) => {
    if (err.response.status !== 404) {
      throw err // if we get a 404 that's fine, if we get something else, throw it.
    }
  })

  let result = await kc.realms.create(realmExport)

  kc.setConfig({
    realmName: realmExport.realm,
  })

  const clients = await kc.clients.find()

  const bearerClient = clients.find(c => c.clientId === BEARER_CLIENT_NAME)
  const publicClient = clients.find(c => c.clientId === PUBLIC_CLIENT_NAME)

  const ourClients = [bearerClient, publicClient]

  for (let realmRole of realmRoleNames) {
    console.log(`creating role ${realmRole}`)
    const role = await kc.roles.create({
      name: realmRole,
      clientRole: false,
      realm: realmExport.realm
    }).catch((err) => {
      if (err.response.status !== 409) {
        throw err // if we get a 409 that's fine, if we get something else, throw it.
      }
    })
  }

  for (let client of ourClients) {
    for (let clientRole of clientRoleNames) {
      console.log(`creating client role ${clientRole} for client ${client.clientId}`)
      const role = await kc.clients.createRole({
        id: client.id,
        name: clientRole,
        clientRole: false,
        realm: realmExport.realm
      }).catch((err) => {
        if (err.response.status !== 409) {
          throw err // if we get a 409 that's fine, if we get something else, throw it.
        }
      })
    }
  }

  realmRoles = await kc.roles.find()
  
  const bearerClientRoles = await kc.clients.listRoles({ id: bearerClient.id })
  const publicClientRoles = await kc.clients.listRoles({ id: publicClient.id })

  for (let user of users) {
    console.log(`creating user ${user.username} with password ${user.password}`)
    const u = await kc.users.create({
      realm: realmExport.realm,
      username: user.username,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: user.password,
          temporary: false
        }
      ]
    })

    for (userRoleName of user.roles) {
      const publicRoleMapping = publicClientRoles.find((role) => { return role.name === userRoleName })
      const bearerRoleMapping = bearerClientRoles.find((role) => { return role.name === userRoleName })
      const realmRoleMapping = realmRoles.find((role) => { return role.name === userRoleName })

      console.log(`assigning client and realm roles called "${userRoleName}" to user ${user.username}`)
      if (publicRoleMapping) {
        await kc.users.addClientRoleMappings({
          id: u.id,
          clientUniqueId: publicRoleMapping.containerId,
          roles: [
            publicRoleMapping
          ]
        })
      }

      if (bearerRoleMapping) {
        await kc.users.addClientRoleMappings({
          id: u.id,
          clientUniqueId: bearerRoleMapping.containerId,
          roles: [
            bearerRoleMapping
          ]
        })
      }

      if (realmRoleMapping) {
        await kc.users.addRealmRoleMappings({
          id: u.id,
          roles: [
            realmRoleMapping
          ]
        })
      }
    }
  }
}

initKeycloak().catch(console.log).then(() => console.log('done'))