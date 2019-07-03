import { ForbiddenError } from 'apollo-server-express'
import { defaultFieldResolver, GraphQLSchema } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import Joi from 'joi'
import pino from 'pino' // also need to figure out where this comes from

import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor'

const log = pino()

export class HasRoleDirective extends SchemaDirectiveVisitor {

  constructor (config: {
      name: string
      args: { [name: string]: any }
      visitedType: VisitableSchemaType
      schema: GraphQLSchema
      context: { [key: string]: any }
    }) {
    // see https://github.com/apollographql/graphql-tools/issues/837
    super(config as any)
  }

  public visitFieldDefinition (field: any) {
    const { resolve = defaultFieldResolver } = field
    const { error, value } = this.validateArgs()
    if (error) {
      log.error(`Invalid hasRole directive on field ${field.name}`, error)
      throw error
    }

    const { roles } = value

    field.resolve = async function (root: any, args: any, context: any, info: any) {
      log.info(`checking user is authorized to access ${field.name} on parent ${info.parentType.name}. Must have one of [${roles}]`)

      if (!context.auth || !context.auth.isAuthenticated()) {
        const AuthorizationErrorMessage = `Unable to find authentication. Authorization is required for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${roles}]`
        log.error({ error: AuthorizationErrorMessage })
        throw new ForbiddenError(AuthorizationErrorMessage)
      }

      const token = context.auth.accessToken

      let foundRole = null // this will be the role the user was successfully authorized on

      foundRole = roles.find((role: string) => {
        return context.auth.hasRole(role)
      })

      if (!foundRole) {
        const AuthorizationErrorMessage = `user is not authorized for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${roles}]`
        log.error({ error: AuthorizationErrorMessage, details: token.content })
        throw new ForbiddenError(AuthorizationErrorMessage)
      }

      log.info(`user successfully authorized with role: ${foundRole}`)

      // Return appropriate error if this is false
      const result = await resolve.apply(this, [root, args, context, info])
      return result
    }
  }

  public validateArgs () {
    // joi is dope. Read the docs and discover the magic.
    // https://github.com/hapijs/joi/blob/master/API.md
    const argsSchema = Joi.object({
      role: Joi.array().required().items(Joi.string()).single()
    })

    const result = argsSchema.validate(this.args)

    // result.value.role will be an array so it makes sense to add the roles alias
    result.value.roles = result.value.role
    return result
  }
}
