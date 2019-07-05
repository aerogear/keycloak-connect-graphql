import { HasRoleDirective, AuthDirective } from './schemaDirectiveVisitors'

export const schemaDirectives = {
  auth: AuthDirective,
  hasRole: HasRoleDirective
}
