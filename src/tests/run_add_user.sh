curl -X POST -H 'Authorization: profile-api-secret-key' -H 'Content-Type: application/json' -H "Accept: application/json" -d '{
            "name": "add_user",
            "params": { "userToken": "sdfe",
            "name": "John Doe", "email": "tets", "status": "CONFIRMED", "code": "sdsd", "did": "", "hiveHost": "localhost", "avatar": "ahjbabha",
             "accountType":"google", "passhash": "kjsdajsb", "isDIDPublished": "false", "onBoardingCompleted": "false", "tutorialStep": "0"},
            "context": {
              "target_did": "did:elastos:iag8qwq1xPBpLsGv4zR4CmzLpLUkBNfPHX",
              "target_app_did": "did:elastos:iag8qwq1xPBpLsGv4zR4CmzLpLUkBNfPHX"
            }
          }' http://localhost:8082/v1/tuumvault_router/scripting/run_script
