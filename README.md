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
- Use something like mailtrap to fill out the smtp server info on .env file with regards to EMAIL_ fields if you want to test email related functionalities
- Use your own github api token for GITHUB_API fields if you want to test github related functionalities provided by the service
- Generate your own Moralis API key at https://moralis.io/ and fill that on MORALIS_API_KEY

- Modify .env file with your own values

- Install dependencies

```
yarn
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
