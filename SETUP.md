# CometSync Firebase + EmailJS Setup Guide

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** → Name it `CometSync`
3. Disable Google Analytics (optional) → Click **Create Project**

## Step 2: Enable Firebase Authentication

1. In Firebase Console → **Build → Authentication → Get Started**
2. Under **Sign-in method** → Enable **Email/Password**
3. Click Save

## Step 3: Create Firestore Database

1. In Firebase Console → **Build → Firestore Database → Create database**
2. Select **Start in test mode** (for development)
3. Choose a region → Click Done

### Firestore Security Rules (paste in Firestore Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    match /stories/{storyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    match /communities/{commId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /chats/{chatId}/messages/{msgId} {
      allow read, write: if request.auth != null;
    }
    match /otps/{otpId} {
      allow read, write: if true; // OTP validation - short-lived docs
    }
  }
}
```

## Step 4: Get Firebase Config Keys

1. In Firebase Console → **Project Settings (gear icon)**
2. Scroll to **"Your apps"** → Click **"</> Web"**
3. Register app name as `CometSync Web`
4. Copy the `firebaseConfig` object — you'll need these values in `script.js`

## Step 5: Set Up EmailJS (for Real OTP Emails)

1. Go to https://www.emailjs.com/ → Sign up (free — 200 emails/month)
2. **Add Email Service**: Email Services → Add Service → Choose Gmail or Outlook
   - Connect your Gmail/Outlook account → Copy the **Service ID**
3. **Create Email Template**: Email Templates → Create New Template
   - Subject: `CometSync - Your Verification Code`
   - Body:
     ```
     Hi {{to_name}},

     Your CometSync OTP verification code is:

     🚀 {{otp_code}} 🚀

     This code expires in 10 minutes.

     If you didn't request this, ignore this message.

     — The CometSync Team ☄️
     ```
   - Copy the **Template ID**
4. Go to **Account → API Keys** → Copy your **Public Key**

## Step 6: Add Your Credentials to script.js

Open `c:\Users\Sandeep\Downloads\CometSync\script.js` and replace the top section:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

const EMAILJS_CONFIG = {
  publicKey: "PASTE_YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "PASTE_YOUR_EMAILJS_SERVICE_ID",
  templateId: "PASTE_YOUR_EMAILJS_TEMPLATE_ID"
};
```

## Step 7: Run the App

The local server should already be running. Open:
```
http://localhost:8000
```

If not running, open a terminal in the CometSync folder and run:
```
node server.js
```
