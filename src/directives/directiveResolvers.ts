export const auth = (next: Function) => (root: any, args: any, context: any, info: any) => {
  if (!context.kauth || !context.kauth.isAuthenticated()) {
    throw new Error(`User not Authenticated`)
  }
  return next(root, args, context, info)
}

export const hasRole = (roles: Array<string>) => (next: Function) => (root: any, args: any, context: any, info: any) => {
  if (!context.kauth || !context.kauth.isAuthenticated()) {
    throw new Error(`User not Authenticated`)
  }

  if (typeof roles === 'string') {
    roles = [roles]
  }

  let foundRole = null // this will be the role the user was successfully authorized on

  for (let role of roles) {
    if (context.kauth.hasRole(role)) {
      foundRole = role
      break
    }
  }

  if (!foundRole) {
    throw new Error(`User is not authorized. Must have one of the following roles: [${roles}]`)
  }

  return next(root, args, context, info)
}
