export interface Logger {
  info(...args: any[]): void
  error(...args: any[]): void
}

export interface KeycloakSecurityServiceOptions {
  log: Logger,
  keycloak: any
}
