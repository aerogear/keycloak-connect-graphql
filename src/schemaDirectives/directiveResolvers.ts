export const directiveResolvers = {
  auth: (next: Function) => (root: any, args: any, context: any, info: any) => {
    if (!context.auth || !context.auth.isAuthenticated()) {
      throw new Error(`User not Authenticated`)
    }
    return next(root, args, context, info)
  },
  hasRole: (roles: Array<string>) => (next: Function) => (root: any, args: any, context: any, info: any) => {
    if (!context.auth || !context.auth.isAuthenticated()) {
      throw new Error(`User not Authenticated`)
    }

    let foundRole = null // this will be the role the user was successfully authorized on

    foundRole = roles.find((role: string) => {
      return context.auth.hasRole(role)
    })

    if (!foundRole) {
      throw new Error(`User is not authorized. Must have one of the following roles: [${roles}]`)
    }

    return next(root, args, context, info)
  }
}
