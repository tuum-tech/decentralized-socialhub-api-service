# curl -H "Authorization: profile-api-secret-key" http://localhost:8000/v1/auth/twitter_request


#curl https://api.twitter.com/1.1/users/show.json?user_id=9512832 -H "Authorization: Bearer 9512832-qWhCAlFClrbxbfUx64oIKnDnNvtL5IQ1scNyIiWsKl"

#curl https://api.twitter.com/2/users/9512832 -H "Authorization: Bearer 9512832-qWhCAlFClrbxbfUx64oIKnDnNvtL5IQ1scNyIiWsKl"

curl --request GET 
  --url 'https://api.twitter.com/1.1/users/show.json?screen_name=twitterdev' 
  --header 'authorization: OAuth oauth_consumer_key="Hjq4sentVtXFOIoq4HbxzzHP3", 
  oauth_nonce="generated-nonce", oauth_signature="generated-signature", 
  oauth_signature_method="HMAC-SHA1", oauth_timestamp="generated-timestamp", 
  oauth_version="1.0"'

    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
        process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET, "1.0A", process.env.TWITTER_CALLBACK_URL, "HMAC-SHA1");

        TWITTER_API_KEY=Hjq4sentVtXFOIoq4HbxzzHP3
TWITTER_API_SECRET=dE1ZDr4ggQI0swwNIRafcrpYJE2MXL0JaUd6y4r8uF2nBaAn4A
TWITTER_CALLBACK_URL=http://localhost:3000/twitter_callback