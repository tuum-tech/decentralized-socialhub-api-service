# Profile API Service

To start, clone profile-api-service repo

```
git clone https://github.com/tuum-tech/profile-api-service.git;
cd profile-api-service;
```

# Run

- Copy example environment file

```
cp .env.example .env
```

- Modify .env file with your own values

- Install dependencies

```
npm i
```

- Start API server in development mode

```
npm run dev
```

# Verify

## Interact with Profile API

- To check whether the API is working:

```
curl http://localhost:8082
```

- POST API:

```
curl -XPOST -H "Authorization: profile-api-secret-key" -H "Content-Type: application/json" -H "Accept: application/json" -d '{}' http://localhost:8082/v1/test
```

## Interact with Assist API

- To create a transaction, run the following:

```
curl -XPOST -H "Authorization: profile-api-secret-key" -H "Content-Type: application/json" -H "Accept: application/json" -d @test/assist_did_request.json http://localhost:8082/v1/assist_router/didtx/create
```

- To retrieve a particular transaction according to confirmation ID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/didtx/confirmation_id/601da2fe9af94bb593b96710
```

- To retrieve all transactions for a particular DID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/didtx/did/did:elastos:ii4ZCz8LYRHax3YB79SWJcMM2hjaHT35KN
```

- To retrieve recent 5 requests for a particular DID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/didtx/recent/did/did:elastos:ii4ZCz8LYRHax3YB79SWJcMM2hjaHT35KN
```

- To retrieve recent 5 DID documents published for a particular DID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/documents/did/did:elastos:ii4ZCz8LYRHax3YB79SWJcMM2hjaHT35KN
```

- To retrieve recent 5 DID documents published for a particular DID from a cryptoname:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/documents/crypto_name/kpwoods
```

- To retrieve service count for did_publish service for a particular DID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/service_count/did_publish/did:elastos:ii4ZCz8LYRHax3YB79SWJcMM2hjaHT35KN
```

- To retrieve service count for all the services for all the DIDs:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/assist_router/service_count/statistics
```

## Interact with Vouch API

To register a provider manually,

```
curl -XPOST -H "Authorization: profile-api-secret-key" -H "Content-Type: application/json" -H "Accept: application/json" -d @test/vouch_new_provider.json http://localhost:8082/v1/vouch_router/providers/create
```

To get all providers:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/providers
```

To get providers for a specific validationType for something like "email":

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/providers/validationType/email
```

To get all services of a provider by its DidId:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/services/provider_did/imxNkhKuuXaefyFKQuzFnkfRdedDVLYmKV
```

To create a transaction:

```
curl -XPOST -H "Authorization: profile-api-secret-key" -H "Content-Type: application/json" -H "Accept: application/json" -d @test/vouch_email_validation.json http://localhost:8082/v1/vouch_router/validationtx/create
```

To get all transactions from a DidId:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/validationtx/did/igZjRKt1HN7toSK3ZPZmNy5NuhfKDhzkUy
```

To get all transactions from a providerId:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/validationtx/provider_id/601f218a1d7678f69a74e866
```

To get all transactions from a provider DID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/validationtx/provider_did/imxNkhKuuXaefyFKQuzFnkfRdedDVLYmKV
```

To get transaction details using confirmationID:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/validationtx/confirmation_id/601f23ada1fb97d4298f0cb2
```

To get total transaction count for a specific provider:

```
curl -H "Authorization: profile-api-secret-key" http://localhost:8082/v1/vouch_router/validationtx/count/provider_id/601f218a1d7678f69a74e866
```

To update isSavedOnProfile transaction information:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" http://localhost:8082/v1/vouch_router/validationtx/is_saved/confirmation_id/601f23ada1fb97d4298f0cb2
```

To approve a transaction using confirmationID:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" -d @test/vouch_approve_tx.json http://localhost:8082/v1/vouch_router/validationtx/approve/confirmation_id/601f23ada1fb97d4298f0cb2
```

To reject a transaction using confirmationID:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" http://localhost:8082/v1/vouch_router/validationtx/reject/confirmation_id/601f23ada1fb97d4298f0cb2
```

To cancel a transaction using confirmationID:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" http://localhost:8082/v1/vouch_router/validationtx/cancel/confirmation_id/601f23ada1fb97d4298f0cb2
```

## Interact with DIDcreds API

- To validate an email using callback from elastOS:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" -d '{"jwt": "JWT_TOKEN_HERE"}' http://localhost:8082/v1/didcreds_router/validation/email_callback_elastos
```

- To validate an internet account of generic type 'type'(eg. 'type' can be 'linkedin', 'twitter', 'gmail', etc):

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" -d '{"did": "did:elastos:iouMSXKHNcwdbPzb58pXpmGBDBxrMzfq2c", "credential_type": "type", "credential_value": "value"}' http://localhost:8082/v1/didcreds_router/validation/internet_account
```

## Interact with Support API

- To send an email:

```
curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" -d '{"subject": "your subject", "description": "your description"}' http://localhost:8082/v1/support_router/send_email
```

## Deploy it on AWS Elastic Beanstalk

```
eb deploy --timeout 240
```
