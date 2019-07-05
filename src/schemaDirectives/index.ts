import { HasRoleDirective } from './hasRole'
import { AuthDirective } from './auth'

export const schemaDirectives = {
  auth: AuthDirective,
  hasRole: HasRoleDirective
}
