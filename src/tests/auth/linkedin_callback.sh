curl -X POST https://www.linkedin.com/oauth/v2/accessToken -d { 'grant_type':'authorization_code', "code":"AQSLChwigLYl9cuI2OzewZbViELR5hQTXil4AehnYAmWir8cBqTzvm9x8DGTerVgy2ce_MBE7OVo8r2qssVBoT4-iB-LSJho8e9OzOFyfrWMLIqLYTcwuKnbkg91d-OK8dIsISGvOUCtwdYS0cc6nnjdkagyLyTZsXnV3dzuBJIa3-MYHvx7KrYEFnm2d_beAB5UWCEL9SXoPCr6mXg", "redirect_uri":"http://localhost:3000/linkedin_callback","client_id":"86k8sv8vmcf7a3", "client_secret""=""MmP79dYDwkTcmLrv"}' -H 'Content-Type: application/x-www-form-urlencoded'

# LINKEDIN_API_KEY=86k8sv8vmcf7a3
# LINKEDIN_API_SECRET=MmP79dYDwkTcmLrv
# LINKEDIN_CALLBACK_URL=http://localhost:3000/linkedin_callback