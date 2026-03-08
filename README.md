# Seven Valet — React Native (Expo) App

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npx expo start

# 3. Scan QR code with Expo Go on your phone
```

---

## Adding / Editing Staff PINs

Open `src/config/users.ts` and edit the `STAFF` array:

```ts
{ id: "d1", name: "Ahmed Al Mansouri", pin: "1234", role: "driver",  location: "Dubai" },
{ id: "l1", name: "Sara Al Zaabi",     pin: "5678", role: "leader",  location: "Dubai" },
{ id: "a1", name: "Seven Admin",       pin: "0000", role: "admin" },
```

- **role** must be: `"driver"` | `"leader"` | `"admin"`
- **pin** must be exactly 4 digits
- **location** is optional — useful for filtering by branch

---

## Roles

| PIN Role | Screen they see |
|---|---|
| `driver` | Incoming requests, park/retrieve flow |
| `leader` | Live queue overview + alerts |
| `admin` | Dashboard, charts, member search |

---

## Before App Store Submission

1. Remove the `<DemoInjectBtn />` from `App.tsx`
2. Replace `WEEKLY` mock data in `AdminScreen.tsx` with a real API call
3. Set your EAS project ID in `app.json`
4. Run `eas build --platform all`

---

## API Endpoints Used

| Action | Endpoint |
|---|---|
| Start parking | `POST /member-cars/parking-request` |
| Mark parked + upload photo | `POST /member-cars/{carId}/photo` |
| Deduct valet credit | `PUT /credits/update-used` |
| Start retrieval | `POST /member-cars/unpark-request` |
| Search members | `GET /members/search?q=` |

All configured in `src/config/api.ts`.

---

## Build for App Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build both platforms
eas build --platform all
```

---

## Getting Your First Zoho Tokens

You need to do this **once** to get your refresh token (it never expires unless revoked).

**Step 1 — Build the authorization URL**

Open this URL in your browser (replace YOUR_CLIENT_ID):
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://www.zohoapis.com/crm/v2
```

**Step 2 — Authorize and copy the code**

Log in with your Zoho admin account → click Accept → you'll be redirected to a URL containing `?code=XXXXXXXX`. Copy that code.

**Step 3 — Exchange code for tokens**

Run this in Terminal (replace the placeholders):
```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://www.zohoapis.com/crm/v2" \
  -d "code=YOUR_CODE_FROM_STEP_2"
```

You'll get back:
```json
{
  "access_token": "1000.xxxx",   ← put in ZOHO_CREDENTIALS.accessToken
  "refresh_token": "1000.xxxx",  ← put in ZOHO_CREDENTIALS.refreshToken (save this!)
  "expires_in": 3600
}
```

**Step 4 — Paste into App.tsx**

Fill in all 4 values in the `ZOHO_CREDENTIALS` object in `App.tsx`. The app will auto-refresh the access token every hour using the refresh token. You never need to do this again.
