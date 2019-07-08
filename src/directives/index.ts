export * from './directiveResolvers'

import { HasRoleDirective, AuthDirective } from './schemaDirectiveVisitors'

export const KeycloakSchemaDirectives = {
  auth: AuthDirective,
  hasRole: HasRoleDirective
}
