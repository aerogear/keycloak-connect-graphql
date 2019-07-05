import { defaultFieldResolver, GraphQLSchema } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { directiveResolvers } from './directiveResolvers'
import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor'

export class AuthDirective extends SchemaDirectiveVisitor {

  constructor (config: {
      name: string
      visitedType: VisitableSchemaType
      schema: GraphQLSchema
      context: { [key: string]: any }
    }) {
    // see https://github.com/apollographql/graphql-tools/issues/837
    super(config as any)
  }

  public visitFieldDefinition (field: any) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = directiveResolvers.auth(resolve)
  }
}