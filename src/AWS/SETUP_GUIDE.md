# MycoTrack — Complete File Placement & Setup Guide

## Folder Structure (final, correct)

```
my-app/
│
├── app/                          ← Expo Router screens ONLY
│   ├── _layout.js                ← ✅ REPLACE — initialises AWS + push
│   ├── index.tsx                 ← redirect to Login (unchanged)
│   └── screens/
│       ├── Dashboard.js          ← ✅ REPLACE
│       ├── Alerts.js             ← ✅ REPLACE
│       ├── Monitoring.js         ← keep / update imports
│       ├── CameraAI.js           ← keep / update imports
│       ├── Settings.js           ← keep / update imports
│       ├── Login.js              ← keep
│       ├── Signup.js             ← keep
│       ├── Signin.js             ← Cognito callback handler
│       ├── ForgotPassword.js     ← keep
│       ├── ResetSuccess.js       ← keep
│       └── Welcome.js            ← keep
│
└── src/
    └── AWS/                      ← ✅ NEW FOLDER — service files live here
        ├── awsConfig.js          ← ✅ NEW (replaces Awsconfig.js)
        ├── cognitoConfig.js      ← ✅ NEW (replaces cognitoConfig.js)
        ├── authService.js        ← ✅ NEW (fully implemented)
        ├── dbService.js          ← ✅ NEW (fully implemented)
        └── usePushNotifications.js ← ✅ NEW
```

## Files to DELETE (they cause Expo Router errors)
```
app/AWS/authService.js     ← DELETE
app/AWS/dbService.js       ← DELETE
app/AWS/AwsAlerts.js       ← DELETE (broken imports)
app/AWS/AwsMonitoring.js   ← DELETE (broken imports)
```

---

## Import Paths After Migration

Any screen in `app/screens/` imports AWS services like this:

```js
// ✅ CORRECT — going up two levels then into src/AWS/
import { loginUser, logoutUser }       from "../../src/AWS/authService";
import { getAlerts, markAlertRead }    from "../../src/AWS/dbService";
import { BACKEND_URL, COGNITO }        from "../../src/AWS/awsConfig";
import { LOGIN_URL, exchangeCodeForTokens } from "../../src/AWS/cognitoConfig";
```

---

## Step-by-Step Setup

### 1. Install packages
```bash
npm install aws-amplify @aws-amplify/auth \
            @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

npx expo install expo-notifications expo-device
```

### 2. Fill in your values in src/AWS/awsConfig.js
- `COGNITO.userPoolId` and `userPoolWebClientId` — from AWS Console → Cognito
- `DYNAMO.region` — match your Cognito region (`eu-north-1`)
- `ALERT_BACKEND_URL` — paste from `sam deploy` output

### 3. Fill in your projectId in src/AWS/usePushNotifications.js
```js
const { data: token } = await Notifications.getExpoPushTokenAsync({
  projectId: "YOUR_EXPO_PROJECT_ID",   // ← from app.json > expo.extra.eas.projectId
});
```

### 4. Add to app.json for push notifications
```json
{
  "expo": {
    "plugins": ["expo-notifications"],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourname.mycotrack"
    }
  }
}
```

### 5. Deploy the Lambda backend (for alerts)
```bash
cd backend_v2/
sam build && sam deploy --guided
# Enter phone number when prompted → you'll get SMS alerts
```

### 6. Run the app
```bash
npx expo start
```

---

## Auth Flow

```
Login.js  →  opens Cognito Hosted UI in browser
                ↓  user logs in
           myapp://signin?code=XXXX   (deep link back to app)
                ↓
          Signin.js  →  exchangeCodeForTokens(code)
                ↓
          Welcome.js  →  Dashboard.js
```

---

## How Alerts Work (end to end)

```
EventBridge (every 2 min)
    → Lambda (lambda_handler.py)
    → evaluates sensor thresholds
    → [warning/danger] → Expo Push API  → your phone notification
                       → AWS SNS SMS    → your phone SMS
    → DynamoDB MycoTrack_Alerts (stored)
    → Alerts.js polls DynamoDB every 30s → shows in app
```
