import { Vault, ScriptingService, DatabaseService,
  VaultSubscription, AppContext, AppContextParameters, ServiceEndpoint, DIDResolverAlreadySetupException } from "@elastosfoundation/hive-js-sdk";
import { HiveContextProvider } from "./hivecontextprovider";

import { Logger, CacheManager } from '@tuum-tech/commons.js.tools';
import { HiveClientParameters } from "./hiveclientparameters";


  export class HiveClient {
    private static APP_INSTANCE_DOCUMENT_CACHE_KEY = 'APP_INSTANCE_DOCUMENT';
    private static LOG = new Logger('HiveClient');
    private databaseService?: DatabaseService;
    private scriptingService?: ScriptingService;
    private vaultSubscriptionService?: VaultSubscription;
    private vaultServices?: Vault;
    private anonymous: boolean;
    private hiveClientParameters: HiveClientParameters;
    private appContext: AppContext;

    private constructor(
      anonymous: boolean,
      appContext: AppContext,
      hiveClientParameters: HiveClientParameters,
      vaultServices?: Vault,
      vaultSubscriptionService?: VaultSubscription
    ) {
      // HiveClient.LOG.debug(
      //   'Creating HiveClient instance with {} ...',
      //   JSON.stringify(appContext)
      // );
      this.anonymous = anonymous;
      this.appContext = appContext;
      this.hiveClientParameters = hiveClientParameters;
      if (!anonymous) {
        this.databaseService = vaultServices?.getDatabaseService();
        this.scriptingService = vaultServices?.getScriptingService();
        this.vaultSubscriptionService = vaultSubscriptionService;
        this.vaultServices = vaultServices;
      } else {
        ;
      }
    }

    get Database(): DatabaseService {
      HiveClient.LOG.trace('Database');
      if (!this.databaseService)
        throw new Error('HiveClient: Authentication required.');
      return this.databaseService;
    }

    get Vault(): Vault {
      HiveClient.LOG.trace('Vault');
      if (!this.vaultServices)
        throw new Error('HiveClient: Authentication required.');
      return this.vaultServices;
    }

    get VaultSubscription(): VaultSubscription {
      HiveClient.LOG.trace('VaultSubscription');
      if (!this.vaultSubscriptionService)
        throw new Error('HiveClient: Authentication required.');
      return this.vaultSubscriptionService;
    }

    get Scripting(): ScriptingService {
      HiveClient.LOG.trace('Scripting');
      if (!this.anonymous && !this.scriptingService)
        throw new Error('HiveClient: Authentication required.');
    //   if (this.anonymous && !this.anonymousScriptingService)
    //     throw new Error('HiveClient: Anonymous Scripting Service unavailable.');
      return this.scriptingService!;
    }

    public isAnonymous(): boolean {
      HiveClient.LOG.trace('isAnonymous');
      return this.anonymous;
    }

    public static async createInstance(
      appContextParameters?: HiveClientParameters
    ): Promise<HiveClient> {
      HiveClient.LOG.trace('createInstance');
      let hiveClient = CacheManager.get('HiveClient', "HiveClient") as HiveClient;

      if (!hiveClient) {
        HiveClient.LOG.debug('Creating new HiveClient instance...');
        const instanceAppContextParameters = appContextParameters;
        HiveClient.LOG.debug(
          'Initializing resolver with {} and {} ...',
          instanceAppContextParameters.resolverUrl,
          instanceAppContextParameters.resolverCache
        );
        try {
          AppContext.setupResolver(
            instanceAppContextParameters.resolverUrl,
            instanceAppContextParameters.resolverCache
          );
        } catch (e) {
          if (!(e instanceof DIDResolverAlreadySetupException)) {
            throw e;
          }
        }
        HiveClient.LOG.debug(
          'Building Hive context with {} ...',
          JSON.stringify(instanceAppContextParameters)
        );
        const appContext = await HiveClient.buildAppContext(
          instanceAppContextParameters
        );
        hiveClient = new HiveClient(
          false,
          appContext,
          instanceAppContextParameters,
          new Vault(appContext, instanceAppContextParameters.hiveHost),
          new VaultSubscription(
            appContext,
            instanceAppContextParameters.hiveHost
          )
        );
        HiveClient.LOG.debug('New HiveClient created.');
        CacheManager.set('Hiveclient', appContextParameters, "HiveClient");
      }
      return hiveClient;
    }

    public async getHiveVersion(): Promise<string> {
      HiveClient.LOG.trace('getHiveVersion');

      const serviceEndpoint = new ServiceEndpoint(
        this.appContext,
        this.hiveClientParameters.hiveHost
      );

      return (await serviceEndpoint.getNodeVersion()).toString();
    }

    // private static resolveDefaultParameters(
    //   hiveClientParameters?: HiveClientParameters
    // ): HiveClientParameters {
    //   HiveClient.LOG.trace('resolveDefaultParameters');
    //   if (!hiveClientParameters) return environmentParameters;
    //   for (const defaultPropertyKey in environmentParameters) {
    //     if (environmentParameters.hasOwnProperty(defaultPropertyKey)) {
    //     const key = defaultPropertyKey as keyof HiveClientParameters;
    //     if (key === 'context') {
    //       if (!hiveClientParameters.context) {
    //         hiveClientParameters.context = environmentParameters.context;
    //       } else {
    //         const appContextParameters = hiveClientParameters.context;
    //         for (const defaultContextPropertyKey in environmentParameters.context) {
    //           if (environmentParameters.context.hasOwnProperty(defaultContextPropertyKey)){
    //             const contextKey = defaultContextPropertyKey as keyof AppContextParameters;
    //             if (!appContextParameters[contextKey]) {
    //               appContextParameters[contextKey] = environmentParameters.context[contextKey] as string;
    //             }
    //           }
    //         }
    //       }
    //     } else {
    //       if (!hiveClientParameters[key]) {
    //         hiveClientParameters[key] = environmentParameters[key];
    //       }
    //     }
    //   }
    //   }
    //   return hiveClientParameters;
    // }


    private static async buildAppContext(
      appContextParameters: HiveClientParameters
    ): Promise<AppContext> {
      HiveClient.LOG.trace('buildAppContext');
      return await AppContext.build(
        await HiveContextProvider.create(appContextParameters.context),
        appContextParameters.context.userDID as string
      );
    }

    public isConnected(): boolean {
      return true;
      // HiveClient.LOG.trace('isConnected');
      // return this.isConnected() || this.getAccessToken() ? true : false;
    }

    public getAccessToken(): string | null {
      HiveClient.LOG.trace('getAccessToken');
      try {
        return this.Vault.getAccessToken().getJwtCode();
      } catch (e) {
        HiveClient.LOG.error(e);
      }
      return null;
    }


  }
