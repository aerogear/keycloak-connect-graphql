export const KeycloakTypeDefs = `directive @hasRole(role: [String]) on FIELD | FIELD_DEFINITION
directive @auth on FIELD | FIELD_DEFINITION
directive @hasPermission(resources: [String]) on FIELD | FIELD_DEFINITION`