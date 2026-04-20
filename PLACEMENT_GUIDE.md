# MycoTrack — File Placement Guide

## The Problem (Why This Matters)
Expo Router treats EVERYTHING inside `app/` as a screen route.
AWS service files (authService, dbService, cognitoConfig) must live OUTSIDE `app/`.

## Correct Folder Structure

my-app/
├── app/
│   ├── _layout.js               ← replace
│   ├── index.tsx                ← replace (redirects to Login)
│   └── screens/
│       ├── Login.js             ← replace
│       ├── Signin.js            ← NEW (Cognito callback handler)
│       ├── Welcome.js           ← replace
│       ├── Signup.js            ← replace
│       ├── ForgotPassword.js    ← replace
│       ├── OtpsVerification.js  ← replace (crash fix)
│       ├── ResetSuccess.js      ← replace
│       ├── Dashboard.js         ← replace
│       ├── Monitoring.js        ← replace
│       ├── CameraAI.js          ← replace
│       ├── Alerts.js            ← replace
│       ├── Settings.js          ← replace
│       └── DiseaseResult.js     ← replace
│
└── src/
    └── AWS/                     ← NEW FOLDER (outside app/)
        ├── cognitoConfig.js     ← NEW
        ├── authService.js       ← MOVED from app/AWS/
        ├── dbService.js         ← MOVED from app/AWS/
        └── (keep AwsAlerts.js, AwsMonitoring.js etc here too if needed)

## DELETE These (they cause Expo Router warnings):
- app/AWS/authService.js
- app/AWS/dbService.js
- app/AWS/AwsAlerts.js        ← imports ./Dashboard which doesn't exist from AWS/
- app/AWS/AwsMonitoring.js    ← same broken import

## Auth Flow
App → Login.js → Cognito Hosted UI (browser) → myapp://signin?code=XXX
  → Signin.js exchanges code for tokens → Welcome.js → Dashboard
