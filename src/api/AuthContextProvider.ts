export type AuthContextProviderClass = new({ req }: { req: any }) => AuthContextProvider
export interface AuthContextProvider {
  isAuthenticated (): boolean
  hasRole (role: string): boolean
}
