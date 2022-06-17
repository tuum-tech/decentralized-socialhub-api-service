import { AppContextParameters } from "@elastosfoundation/hive-js-sdk";

  export class HiveClientParameters {
    public context = {} as AppContextParameters;
    public hiveHost = '';
    public resolverUrl = '';
    public resolverCache = '';
  }