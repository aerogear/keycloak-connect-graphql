import { AuthContextProvider } from './AuthContextProvider'
import { SecurityService } from './SecurityService'

export class DefaultSecurityService implements SecurityService {

  public getTypeDefs () {
    return ''
  }
  public getSchemaDirectives () {
    return {}
  }

  public applyAuthMiddleware () {
    return null
  }

  public getAuthContextProvider () {
    return DefaultAuthContextProvider
  }

  public onSubscriptionConnect() {
    return new Promise((resolve, reject) => resolve())
  }
}

export class DefaultAuthContextProvider implements AuthContextProvider {

  public isAuthenticated () {
    return false
  }

  public hasRole () {
    return false
  }
}
