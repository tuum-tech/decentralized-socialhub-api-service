import {
    Claims,
    DID,
    DIDDocument,
    DIDStore,
    DIDURL,
    Issuer,
    JWTHeader,
    JWTParserBuilder,
    RootIdentity,
    VerifiableCredential,
    VerifiablePresentation,
    JWT
  } from '@elastosfoundation/did-js-sdk';

import { AppContextProvider, AppContextParameters, HiveException }  from "@elastosfoundation/hive-js-sdk";

import dayjs from 'dayjs';
// import { DID as CNDID } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { Logger } from '@tuum-tech/commons.js.tools';


  export class HiveContextProvider implements AppContextProvider {
    private static LOG = new Logger('HiveContextProvider');
    private contextParameters: AppContextParameters;

    private appRootId?: RootIdentity;
    private userRootId?: RootIdentity;
    private store?: DIDStore;

    constructor(contextParameters: AppContextParameters) {
      this.contextParameters = contextParameters;
    }

    public static async create(
      contextParameters: AppContextParameters
    ): Promise<AppContextProvider> {
      HiveContextProvider.LOG.trace('create');
      const defaultAppContext = new HiveContextProvider(contextParameters);

      await defaultAppContext.init();
      return defaultAppContext;
    }

    async init(): Promise<void> {
      HiveContextProvider.LOG.trace('init');
      this.store = await DIDStore.open(this.contextParameters.storePath);
      this.appRootId = await this.initPrivateIdentity(
        this.contextParameters.appMnemonics,
        this.contextParameters.appDID,
        this.contextParameters.appPhrasePass,
        this.contextParameters.appStorePass
      );
      HiveContextProvider.LOG.debug('Init app private identity');
      await this.initDid(this.appRootId);
    }

    public async initPrivateIdentity(
      mnemonic: string,
      did: string | DID,
      phrasePass: string,
      storePass: string
    ): Promise<RootIdentity> {
      HiveContextProvider.LOG.trace('initPrivateIdentity');
      HiveContextProvider.LOG.debug('Opens store');

      const id = RootIdentity.getIdFromMnemonic(mnemonic, phrasePass);

      HiveContextProvider.LOG.debug('ID from mnemonic {} : {}', mnemonic, id);

      if (this.store!.containsRootIdentity(id)) {
        HiveContextProvider.LOG.debug('Store constains RootIdentity');
        return await this.store!.loadRootIdentity(id);
      }

      let rootIdentity: RootIdentity;
      try {
        HiveContextProvider.LOG.info(
          'Creating root identity for mnemonic {}',
          mnemonic
        );
        rootIdentity = RootIdentity.createFromMnemonic(
          mnemonic,
          phrasePass,
          this.store!,
          storePass
        );
      } catch (e) {
        HiveContextProvider.LOG.error(
          'Error Creating root identity for mnemonic {}. Error {}',
          mnemonic,
          JSON.stringify(e)
        );
        throw new Error('Error Creating root identity for mnemonic');
      }

      await rootIdentity.synchronize();

      did = rootIdentity.getDid(0);
      const doc = await DID.from(did)?.resolve(true);

      HiveContextProvider.LOG.debug(`document resolved: ${doc.toString()}`);
      await this.store?.storeDid(doc as DIDDocument);

      // let userDocument = await this.store?.loadDid(did);

      // this.store!.storeRootIdentity(rootIdentity, storePass);
      return rootIdentity;
    }

    public async initDid(rootIdentity: RootIdentity): Promise<void> {
      HiveContextProvider.LOG.trace(`initDid ${this.contextParameters.appDID}`);


      const did: DID = DID.from(`${this.contextParameters.appDID}`) as DID;



      HiveContextProvider.LOG.debug(`DID to String: ${did.toString()}`);
      const resolvedDoc = await did.resolve(true);
      await this.store!.storeDid(resolvedDoc);
      HiveContextProvider.LOG.debug('Resolve app doc');
    }

    getLocalDataDir(): string {
      HiveContextProvider.LOG.trace(`getLocalDataDir: ${this.contextParameters.storePath}`);
      return this.contextParameters.storePath;
    }

    /**
     * The method for upper Application to implement to provide current application
     * instance did document as the running context.
     * @return The application instance did document.
     */
    async getAppInstanceDocument(): Promise<DIDDocument> {
      HiveContextProvider.LOG.trace('getAppInstanceDocument');
      return await this.getAppDocument();
    }

    /**
     * The method for upper Application to implement to acquire the authorization
     * code from user's approval.
     * @param authenticationChallengeJWtCode  The input challenge code from back-end node service.
     * @return The credential issued by user.
     */
    async getAuthorization(
      authenticationChallengeJWtCode: string
    ): Promise<string> {
      HiveContextProvider.LOG.trace('getAuthorization');
      try {
        const claims: Claims = (
          await new JWTParserBuilder()
            .build()
            .parse(authenticationChallengeJWtCode)
        ).getBody();
        if (claims == null)
          throw new HiveException('Invalid jwt token as authorization.');

        HiveContextProvider.LOG.debug('getAuthorization createPresentation');

        const presentation = await this.generateVerifiablePresentationFromUserMnemonics(
              this.contextParameters.userMnemonics,
              this.contextParameters.userPhrasePass,
              claims.getIssuer(),
              claims.get('nonce') as string
            );
          // : await this.generateVerifiablePresentationFromEssentialCred(
          //     claims.getIssuer(),
          //     claims.get('nonce') as string
          //   );

        // TestData.LOG.debug("TestData->presentation: " + presentation.toString(true));
        return await this.createToken(presentation, claims.getIssuer());
      } catch (e) {
        HiveContextProvider.LOG.error(
          'TestData->getAuthorization error: {} stack {}',
          e,
          e.stack
        );
        // throw new HiveContextProviderException(e.message);
        return '';
      }
    }

    // Copied from did.service.new.ts
    private getExpirationDate() {
      HiveContextProvider.LOG.trace('getExpirationDate');
      const d = new Date();
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const c = new Date(year + 5, month, day);
      return c;
    }

    // Copied from did.service.new.ts
    private async generateVerifiablePresentationFromUserMnemonics(
      userMnemonic: string,
      password: string,
      issuer: string,
      nonce: string
    ): Promise<any> {
      HiveContextProvider.LOG.trace(
        'generateVerifiablePresentationFromUserMnemonics'
      );


      HiveContextProvider.LOG.debug(`user mnemonics: ${userMnemonic}  password: ${password}`)
      // the storePrivateKey method should probably go to loadDid method

      // ----------------------

      try {
        const id = RootIdentity.getIdFromMnemonic(userMnemonic, password);
        const rootIdentityUser = this.store?.containsRootIdentity(id)
          ? await this.store?.loadRootIdentity(id)
          : RootIdentity.createFromMnemonic(
              userMnemonic,
              password,
              this.store as DIDStore,
              this.contextParameters.appStorePass
            );

        const userDid = rootIdentityUser.getDid(0);
        const userDoc = await DID.from(userDid)?.resolve(true);
        await this.store?.storeDid(userDoc as DIDDocument);

        const userDocument = (await this.store?.loadDid(userDid)) as DIDDocument;
        const doc = await this.getAppDocument();
        const didUrl: DIDURL = DIDURL.from(
          '#primary',
          userDocument.getSubject()
        ) as DIDURL;

        const issuerObject = new Issuer(userDocument, didUrl);
        // let vcBuilder = new VerifiableCredential.Builder(issuerObject, userDid);
        const vcBuilder = new VerifiableCredential.Builder(
          issuerObject,
          doc.getSubject()
        );

        const vc = await vcBuilder
          .expirationDate(this.getExpirationDate())
          .type('AppIdCredential')
          .property('appDid', doc.getSubject().toString())
          .property('appInstanceDid', doc.getSubject().toString())
          .id(
            DIDURL.from(
              '#app-id-credential',
              doc.getSubject().toString()
            ) as DIDURL
          )
          .seal(this.contextParameters.appStorePass); // and we sign so it creates a Proof with method and signature

        await this.store?.storeCredential(vc);

        const vpb = await VerifiablePresentation.createFor(
          doc.getSubject(),
          null,
          this.store as DIDStore
        );
        const vp = await vpb
          .realm(issuer)
          .nonce(nonce)
          .credentials(vc)
          .seal(this.contextParameters.appStorePass);

        // console.log('vp: ' + vp.toString(true));
        return vp;
      } catch (e) {
        HiveContextProvider.LOG.debug('Error generating presentation {}', e);
      }
    }



    private async getAppDocument(): Promise<DIDDocument> {
      HiveContextProvider.LOG.trace('getAppDocument');
      return await this.store!.loadDid(this.contextParameters.appDID);
    }

    private async createToken(
      vp: VerifiablePresentation,
      hiveDid: string
    ): Promise<string> {
      HiveContextProvider.LOG.trace('createToken');
      const cal = dayjs();
      const iat = cal.unix();
      const nbf = cal.unix();
      const exp = cal.add(3, 'month').unix();

      let storePassword: string | undefined;
      if (this.contextParameters.userMnemonics === '') {
        // // Create JWT token with presentation.
        // const didAccess = new CNDID.DIDAccess();
        // const response = await didAccess.getExistingAppInstanceDIDInfo();
        // storePassword = response.storePassword;
      } else {
        storePassword = this.contextParameters.appStorePass;
      }

      const doc: DIDDocument = await this.getAppDocument();
      const token = await doc
        .jwtBuilder()
        .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
        .addHeader('version', '1.0')
        .addHeader(JWTHeader.CONTENT_TYPE, 'json')
        .setSubject('DIDAuthResponse')
        .setAudience(hiveDid)
        .setIssuedAt(iat)
        .setExpiration(exp)
        .setNotBefore(nbf)
        .claimsWithJson('presentation', vp.toString(true))
        .sign(storePassword);

      return token;
    }

    public getAppDid(): DID | null {
      HiveContextProvider.LOG.trace('getAppDid');
      return DID.from(this.contextParameters.appDID);
    }
  }
