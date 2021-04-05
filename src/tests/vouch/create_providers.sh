curl -XPOST \
-H "Authorization: profile-api-secret-key" \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-d @vouch_new_provider.json http://localhost:8000/v1/vouch_router/providers/create

# curl -XPOST \
# -H "Authorization: profile-api-secret-key" \
# -H "Content-Type: application/json" \
# -H "Accept: application/json" \
# -d @vouch_new_provider.json http://localhost:8000/v1/vouch_router/providers/create

