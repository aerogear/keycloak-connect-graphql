import * as express from 'express'

/**
 * The JavaScript module is exported as a single function, but for TypeScript we
 * need to export the function and a set of interfaces so developers can assign
 * types such as Grant, Token, etc. to variables in their own code.
 * 
 * To achieve this we export "KeycloakConnect" that references a namespace
 * containing our typings, and a static instance exposing the constructor
 */
declare const KeycloakConnect: KeycloakConnectStatic
export = KeycloakConnect

interface KeycloakConnectStatic {
  new (options: KeycloakConnect.KeycloakOptions, config: KeycloakConnect.KeycloakConfig): KeycloakConnect.Keycloak
}

declare namespace KeycloakConnect {

  interface KeycloakConfig {
    'confidential-port': string|number
    'auth-server-url': string
    'resource': string
    'ssl-required': string
    'bearer-only'?: boolean
    realm: string
  }

  interface KeycloakOptions {
    scope?: string
    store?: any
    cookies?: boolean
  }

  interface GrantProperties {
    access_token?: string
    refresh_token?: string
    id_token?: string
    expires_in?: string
    token_type?: string
  }

  interface Token {
    isExpired(): boolean
    hasRole(roleName: string): boolean
    hasApplicationRole(appName: string, roleName: string): boolean
    hasRealmRole(roleName: string): boolean
  }

  interface GrantManager {
    /**
     * Use the direct grant API to obtain a grant from Keycloak.
     *
     * The direct grant API must be enabled for the configured realm
     * for this method to work. This function ostensibly provides a
     * non-interactive, programatic way to login to a Keycloak realm.
     *
     * @param {String} username The username.
     * @param {String} password The cleartext password.
     */
    obtainDirectly(username: string, password: string): Promise<Grant>

    /**
     * Obtain a grant from a previous interactive login which results in a code.
     *
     * This is typically used by servers which receive the code through a
     * redirect_uri when sending a user to Keycloak for an interactive login.
     *
     * An optional session ID and host may be provided if there is desire for
     * Keycloak to be aware of this information.  They may be used by Keycloak
     * when session invalidation is triggered from the Keycloak console itself
     * during its postbacks to `/k_logout` on the server.
     *
     * @param {String} code The code from a successful login redirected from Keycloak.
     * @param {String} sessionId Optional opaque session-id.
     * @param {String} sessionHost Optional session host for targetted Keycloak console post-backs.
     */
    obtainFromCode(code: string, sessionid?: string, sessionHost?: string, callback?: (err: Error, grant: Grant) => void): Promise<Grant>


    /**
     * Obtain a service account grant.
     * Client option 'Service Accounts Enabled' needs to be on.
     *
     * This method returns or promise or may optionally take a callback function.
     *
     * @param {Function} callback Optional callback, if not using promises.
     */
    obtainFromClientCredentials (callback?: (err: Error, grant: Grant) => void, scopeParam?: string): Promise<Grant>

    /**
     * Ensure that a grant is *fresh*, refreshing if required & possible.
     *
     * If the access_token is not expired, the grant is left untouched.
     *
     * If the access_token is expired, and a refresh_token is available,
     * the grant is refreshed, in place (no new object is created),
     * and returned.
     *
     * If the access_token is expired and no refresh_token is available,
     * an error is provided.
     *
     * @param {Grant} grant The grant object to ensure freshness of
     */
    ensureFreshness (grant: Grant): Promise<Grant>

    /**
     * Perform live validation of an `access_token` against the Keycloak server.
     *
     * @param {Token|String} token The token to validate.
     * @param {Function} callback Callback function if not using promises.
     *
     * @return {boolean} `false` if the token is invalid, or the same token if valid.
     */
    validateAccessToken<T extends Token|string>(token: T): Promise<false|T>

    /**
     * Create a `Grant` object from a string of JSON data.
     *
     * This method creates the `Grant` object, including
     * the `access_token`, `refresh_token` and `id_token`
     * if available, and validates each for expiration and
     * against the known public-key of the server.
     *
     * @param {String|GrantProperties} rawData The raw JSON string received from the Keycloak server or from a client.
     * @return {Promise} A promise reoslving a grant.
     */
    createGrant(data: string|GrantProperties): Promise<Grant>

    /**
     * Validate the grant and all tokens contained therein.
     *
     * This method examines a grant (in place) and rejects
     * if any of the tokens are invalid. After this method
     * resolves, the passed grant is guaranteed to have
     * valid tokens.
     *
     * @param {Grant} grant The grant to validate.
     *
     * @return {Promise} That resolves to a validated grant or
     * rejects with an error if any of the tokens are invalid.
     */
    validateGrant(grant: Grant): Promise<Grant>

    /**
     * Validate a token.
     *
     * This method accepts a token, and returns a promise
     *
     * If the token is valid the promise will be resolved with the token
     * 
     * If the token is undefined or fails validation an applicable error is returned
     * 
     * @return {Promise} That resolve a token
     */
    validateToken(token?: Token, expectedType?: string): Promise<Token>
  }

  interface Grant extends GrantProperties {
    /**
     * Update this grant in-place given data in another grant.
     *
     * This is used to avoid making client perform extra-bookkeeping
     * to maintain the up-to-date/refreshed grant-set.
     */
    update(grant: Grant): void

    /**
     * Returns the raw String of the grant, if available.
     *
     * If the raw string is unavailable (due to programatic construction)
     * then `undefined` is returned.
     */
    toString(): string|undefined

    /**
     * Determine if this grant is expired/out-of-date.
     *
     * Determination is made based upon the expiration status of the `access_token`.
     *
     * An expired grant *may* be possible to refresh, if a valid
     * `refresh_token` is available.
     *
     * @return {boolean} `true` if expired, otherwise `false`.
     */
    isExpired(): boolean
  }

  type GaurdFn = (accessToken: string, req: express.Request, res: express.Response) => boolean


  interface Keycloak {
    config: {[key: string]: any}

    grantManager: GrantManager

    /**
     * Obtain an array of middleware for use in your application.
     *
     * Generally this should be installed at the root of your application,
     * as it provides general wiring for Keycloak interaction, without actually
     * causing Keycloak to get involved with any particular URL until asked
     * by using `protect(...)`.
     *
     * Example:
     *
     *     var app = express();
     *     var keycloak = new Keycloak();
     *     app.use( keycloak.middleware() );
     *
     * Options:
     *
     *  - `logout` URL for logging a user out. Defaults to `/logout`.
     *  - `admin` Root URL for Keycloak admin callbacks.  Defaults to `/`.
     *
     * @param {Object} options Optional options for specifying details.
     */
    middleware(options?: { admin?: string, logout?: string }): express.RequestHandler[]

    /**
     * Apply protection middleware to an application or specific URL.
     *
     * If no `spec` parameter is provided, the subsequent handlers will
     * be invoked if the user is authenticated, regardless of what roles
     * he or she may or may not have.
     *
     * If a user is not currently authenticated, the middleware will cause
     * the authentication workflow to begin by redirecting the user to the
     * Keycloak installation to login.  Upon successful login, the user will
     * be redirected back to the originally-requested URL, fully-authenticated.
     *
     * If a `spec` is provided, the same flow as above will occur to ensure that
     * a user it authenticated.  Once authenticated, the spec will then be evaluated
     * to determine if the user may or may not access the following resource.
     *
     * The `spec` may be either a `String`, specifying a single required role,
     * or a function to make more fine-grained determination about access-control
     *
     * If the `spec` is a `String`, then the string will be interpreted as a
     * role-specification according to the following rules:
     *
     *  - If the string starts with `realm:`, the suffix is treated as the name
     *    of a realm-level role that is required for the user to have access.
     *  - If the string contains a colon, the portion before the colon is treated
     *    as the name of an application within the realm, and the portion after the
     *    colon is treated as a role within that application.  The user then must have
     *    the named role within the named application to proceed.
     *  - If the string contains no colon, the entire string is interpreted as
     *    as the name of a role within the current application (defined through
     *    the installed `keycloak.json` as provisioned within Keycloak) that the
     *    user must have in order to proceed.
     *
     * Example
     *
     *     // Users must have the `special-people` role within this application
     *     app.get( '/special/:page', keycloak.protect( 'special-people' ), mySpecialHandler );
     *
     * If the `spec` is a function, it may take up to two parameters in order to
     * assist it in making an authorization decision: the access token, and the
     * current HTTP request.  It should return `true` if access is allowed, otherwise
     * `false`.
     *
     * The `token` object has a method `hasRole(...)` which follows the same rules
     * as above for `String`-based specs.
     *
     *     // Ensure that users have either `nicepants` realm-level role, or `mr-fancypants` app-level role.
     *     function pants(token, request) {
     *       return token.hasRole( 'realm:nicepants') || token.hasRole( 'mr-fancypants');
     *     }
     *
     *     app.get( '/fancy/:page', keycloak.protect( pants ), myPantsHandler );
     *
     * With no spec, simple authentication is all that is required:
     *
     *     app.get( '/complain', keycloak.protect(), complaintHandler );
     *
     * @param {String} spec The protection spec (optional)
     */
    protect(spec: GaurdFn|string): express.RequestHandler

    /**
     * Callback made upon successful authentication of a user.
     *
     * By default, this a no-op, but may assigned to another
     * function for application-specific login which may be useful
     * for linking authentication information from Keycloak to
     * application-maintained user information.
     *
     * The `request.kauth.grant` object contains the relevant tokens
     * which may be inspected.
     *
     * For instance, to obtain the unique subject ID:
     *
     *     request.kauth.grant.id_token.sub => bf2056df-3803-4e49-b3ba-ff2b07d86995
     *
     * @param {Object} request The HTTP request.
     */
    authenticated(req: express.Request): void

    /**
     * Callback made upon successful de-authentication of a user.
     *
     * By default, this is a no-op, but may be used by the application
     * in the case it needs to remove information from the user's session
     * or otherwise perform additional logic once a user is logged out.
     *
     * @param {Object} request The HTTP request.
     */
    deauthenticated(req: express.Request): void

    /**
     * Replaceable function to handle access-denied responses.
     *
     * In the event the Keycloak middleware decides a user may
     * not access a resource, or has failed to authenticate at all,
     * this function will be called.
     *
     * By default, a simple string of "Access denied" along with
     * an HTTP status code for 403 is returned.  Chances are an
     * application would prefer to render a fancy template.
     * @param {Object} request The HTTP request.
     * @param {Object} response The HTTP response.
     */
    accessDenied(req: express.Request, res: express.Response): void


    getGrant(req: express.Request, res: express.Response): Promise<Grant>

    storeGrant(grant: Grant, req: express.Request, res: express.Response): Grant

    unstoreGrant(sessionId: string): void

    getGrantFromCode(code: string, req: express.Request, res: express.Response): Promise<Grant>

    loginUrl(uuid: string, redirectUrl: string): string

    logoutUrl(redirectUrl: string): string

    accountUrl(): string

    // Uses deprecated method
    // getAccount

    redirectToLogin(req: express.Request): boolean
  }

}