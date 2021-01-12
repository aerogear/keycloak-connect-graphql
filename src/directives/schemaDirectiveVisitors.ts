import { defaultFieldResolver, GraphQLSchema } from 'graphql'
import { SchemaDirectiveVisitor } from '@graphql-tools/utils'
import { auth, hasPermission, hasRole } from './directiveResolvers'
import { VisitableSchemaType } from '@graphql-tools/utils'

export class AuthDirective extends SchemaDirectiveVisitor {

  constructor(config: {
    name: string
    visitedType: VisitableSchemaType
    schema: GraphQLSchema
    args: {},
    context: { [key: string]: any }
  }) {
    super(config)
  }

  public visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = auth(resolve)
  }
}

export class HasRoleDirective extends SchemaDirectiveVisitor {

  constructor(config: {
    name: string
    args: { [name: string]: any }
    visitedType: VisitableSchemaType
    schema: GraphQLSchema
    context: { [key: string]: any }
  }) {
    super(config)
  }

  public visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field
    const roles = this.parseAndValidateArgs(this.args)
    field.resolve = hasRole(roles)(resolve)
  }

  /**
   * 
   * validate a potential string or array of values
   * if an array is provided, cast all values to strings
   */
  public parseAndValidateArgs(args: { [name: string]: any }): Array<string> {
    const keys = Object.keys(args)

    if (keys.length === 1 && keys[0] === 'role') {
      const role = args[keys[0]]
      if (typeof role == 'string') {
        return [role]
      } else if (Array.isArray(role)) {
        return role.map(val => String(val))
      } else {
        throw new Error(`invalid hasRole args. role must be a String or an Array of Strings`)
      }
    }
    throw Error('invalid hasRole args. must contain only a \'role\ argument')
  }
}

export class HasPermissionDirective extends SchemaDirectiveVisitor {

  constructor(config: {
    name: string
    args: { [name: string]: any }
    visitedType: VisitableSchemaType
    schema: GraphQLSchema
    context: { [key: string]: any }
  }) {
    super(config)
  }

  public visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field
    const resources = this.parseAndValidateArgs(this.args)
    field.resolve = hasPermission(resources)(resolve)
  }

  /**
   * 
   * validate a potential string or array of values
   * if an array is provided, cast all values to strings
   */
  public parseAndValidateArgs(args: { [name: string]: any }): Array<string> {
    const keys = Object.keys(args)

    if (keys.length === 1 && keys[0] === 'resources') {
      const resources = args[keys[0]]
      if (typeof resources == 'string') {
        return [resources]
      } else if (Array.isArray(resources)) {
        return resources.map(val => String(val))
      } else {
        throw new Error(`invalid hasPermission args. resources must be a String or an Array of Strings`)
      }
    }
    throw Error('invalid hasPermission args. must contain only a \'resources\ argument')
  }
}