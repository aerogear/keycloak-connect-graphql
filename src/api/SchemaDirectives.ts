import { SchemaDirectiveVisitor } from 'graphql-tools'

export type SchemaDirectives = Record<string, typeof SchemaDirectiveVisitor>
