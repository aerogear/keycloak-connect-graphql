import { ForbiddenError } from 'apollo-server-express'
import { defaultFieldResolver, GraphQLSchema } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import Joi from 'joi'
import pino from 'pino' // also need to figure out where this comes from
import { directiveResolvers } from './directiveResolvers'

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

    field.resolve = directiveResolvers.hasRole(roles)(resolve)
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
