// ─────────────────────────────────────────────────────────────
//  SEVEN VALET — Zoho CRM API Layer
//  All valet data lives in Zoho CRM Valet_Parkings module
// ─────────────────────────────────────────────────────────────

const ZOHO_BASE = "https://www.zohoapis.com/crm/v2";
const BACKEND_BASE = "https://7backend2026.sevenwellness.club/api/v1";

// ── Token Management with Auto-Refresh ───────────────────────
let _accessToken: string = "";
let _refreshToken: string = "";
let _clientId: string = "";
let _clientSecret: string = "";
let _tokenExpiry: number = 0;
let _refreshPromise: Promise<void> | null = null;

export const ZohoAuth = {
  init: (config: {
    accessToken: string;
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    expiresInSeconds?: number;
  }) => {
    _accessToken  = config.accessToken;
    _refreshToken = config.refreshToken;
    _clientId     = config.clientId;
    _clientSecret = config.clientSecret;
    _tokenExpiry  = Date.now() + (config.expiresInSeconds ?? 3600) * 1000;
    console.log("✅ ZohoAuth initialized. Token expires in", config.expiresInSeconds ?? 3600, "seconds.");
  },

  getToken: () => _accessToken,
  isExpired: () => Date.now() >= _tokenExpiry - 60000,

  refresh: async (): Promise<void> => {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
      console.log("🔄 Refreshing Zoho access token...");
      try {
        const params = new URLSearchParams({
          grant_type:    "refresh_token",
          client_id:     _clientId,
          client_secret: _clientSecret,
          refresh_token: _refreshToken,
        });

        const res = await fetch(
          `https://accounts.zoho.com/oauth/v2/token?${params.toString()}`,
          { method: "POST" }
        );

        const data = await res.json();

        if (data.access_token) {
          _accessToken = data.access_token;
          _tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
          console.log("✅ Zoho token refreshed. Next expiry in", data.expires_in, "seconds.");
        } else {
          console.error("❌ Token refresh failed:", data);
          throw new Error(data.error || "Token refresh failed");
        }
      } finally {
        _refreshPromise = null;
      }
    })();

    return _refreshPromise;
  },
};

// ── Core Fetch (with auto-refresh) ───────────────────────────
async function zohoFetch(path: string, opts: RequestInit = {}, retried = false): Promise<any> {
  if (!_accessToken) throw new Error("No Zoho access token. Call ZohoAuth.init() first.");

  if (ZohoAuth.isExpired()) {
    await ZohoAuth.refresh();
  }

  const headers: Record<string, string> = {
    "Authorization": `Zoho-oauthtoken ${_accessToken}`,
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${ZOHO_BASE}${path}`, { ...opts, headers });

  if (res.status === 401 && !retried) {
    console.warn("⚠️ Got 401 from Zoho — refreshing token and retrying...");
    await ZohoAuth.refresh();
    return zohoFetch(path, opts, true);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Zoho API error ${res.status}`);
  return data;
}

// ── Simple in-memory cache ────────────────────────────────────
const MEMBER_LOCATION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const _memberLocationCache = new Map<string, { value: string | null; ts: number }>();
const _memberLocationInFlight = new Map<string, Promise<string | null>>();

// ── Status Values ─────────────────────────────────────────────
export const ZOHO_STATUS = {
  REQUESTED:        "Requested",
  PARKED:           "Parked",
  UNPARK_REQUESTED: "Unpark Requested",
  DELIVERED:        "Delivered",
  INVALID:          "Invalid Parking Request",
};

export const APP_TO_ZOHO: Record<string, string> = {
  pending:    ZOHO_STATUS.REQUESTED,
  accepted:   ZOHO_STATUS.REQUESTED,
  parking:    ZOHO_STATUS.REQUESTED,
  parked:     ZOHO_STATUS.PARKED,
  retrieving: ZOHO_STATUS.UNPARK_REQUESTED,
  ready:      ZOHO_STATUS.UNPARK_REQUESTED,
  completed:  ZOHO_STATUS.DELIVERED,
};

export const ZOHO_TO_APP: Record<string, string> = {
  [ZOHO_STATUS.REQUESTED]:        "pending",
  [ZOHO_STATUS.PARKED]:           "parked",
  [ZOHO_STATUS.UNPARK_REQUESTED]: "retrieving",
  [ZOHO_STATUS.DELIVERED]:        "completed",
  [ZOHO_STATUS.INVALID]:          "completed",
};

// ── Types ─────────────────────────────────────────────────────
export interface ZohoValetRecord {
  id: string;
  Name: string;
  Status: string;
  Member_Name: { id: string; name: string } | null;
  Member_Car_Name: { id: string; name: string } | null;
  Plate_Number: string | null;
  Parking_Location: string | null;
  Club_Location: string | null;
  KeyHolderID: string | null;
  ParkIN_Date_Time: string | null;
  ParkIN_Completed_Date_Time: string | null;
  ParkOut_Request_Date_Time: string | null;
  ParkOut_Date_Time: string | null;
  Club_Location_Valet_Parking: { id: string; name: string } | null;
  Membership_Type_Valet_Parking: { id: string; name: string } | null;
  Daily_Valet_Credit: boolean;
  Created_Time: string;
  memberHomeClub?: string | null;
}

// ── Valet Parkings ────────────────────────────────────────────
export async function fetchValetRequests(): Promise<ZohoValetRecord[]> {
  try {
    const data = await zohoFetch(
      "/Valet_Parkings?fields=Name,Status,Member_Name,Member_Car_Name,Plate_Number,Parking_Location,Club_Location,KeyHolderID,ParkIN_Date_Time,ParkIN_Completed_Date_Time,ParkOut_Request_Date_Time,ParkOut_Date_Time,Membership_Type_Valet_Parking,Daily_Valet_Credit,Created_Time&sort_by=Created_Time&sort_order=desc&per_page=50"
    );
    return data.data || [];
  } catch (e: any) {
    if (e.message === "ZOHO_TOKEN_EXPIRED") throw e;
    console.warn("fetchValetRequests:", e.message);
    return [];
  }
}

// Fetch a member's home club location from Contacts (field API name: Location)
export async function fetchMemberLocation(contactId: string): Promise<string | null> {
  try {
    const cached = _memberLocationCache.get(contactId);
    if (cached && Date.now() - cached.ts < MEMBER_LOCATION_TTL_MS) {
      console.log("fetchMemberLocation (cache hit) → contactId:", contactId, "result:", cached.value);
      return cached.value;
    }

    const existing = _memberLocationInFlight.get(contactId);
    if (existing) {
      console.log("fetchMemberLocation (in-flight) → contactId:", contactId);
      return await existing;
    }

    const p = (async () => {
      console.log("fetchMemberLocation → contactId:", contactId);
      const data = await zohoFetch(`/Contacts/${contactId}?fields=Location`);
      const location = data?.data?.[0]?.Location ?? null;
      _memberLocationCache.set(contactId, { value: location, ts: Date.now() });
      console.log("fetchMemberLocation ← result:", location);
      return location;
    })();

    _memberLocationInFlight.set(contactId, p);
    try {
      return await p;
    } finally {
      _memberLocationInFlight.delete(contactId);
    }
  } catch {
    return null;
  }
}

// Update any fields on a valet record
export async function updateValetRecord(
  id: string,
  fields: Partial<{
    Status: string;
    Parking_Location: string;
    KeyHolderID: string;
    ParkIN_Completed_Date_Time: string;
    ParkOut_Date_Time: string;
  }>
) {
  console.log("ZOHO UPDATE:", id, JSON.stringify(fields));
  const zohoResp = await zohoFetch(`/Valet_Parkings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: [fields] }),
  });
  console.log("ZOHO RESPONSE:", JSON.stringify(zohoResp));
  return zohoResp;
}

export async function markAsParked(id: string, spot: string) {
  return updateValetRecord(id, {
    Status: ZOHO_STATUS.PARKED,
    Parking_Location: spot,
    ParkIN_Completed_Date_Time: new Date().toISOString().split(".")[0] + "+04:00",
  });
}

export async function markUnparkRequested(id: string) {
  return updateValetRecord(id, { Status: ZOHO_STATUS.UNPARK_REQUESTED });
}

export async function markAsDelivered(id: string) {
  return updateValetRecord(id, {
    Status: ZOHO_STATUS.DELIVERED,
    ParkOut_Date_Time: new Date().toISOString().split(".")[0] + "+04:00",
  });
}

// ── Upload car photo (via your backend) ───────────────────────
let _backendToken = "";
export const setBackendToken = (t: string) => { _backendToken = t; };

export async function uploadCarPhoto(carId: string, uri: string) {
  const form = new FormData();
  form.append("file", { uri, type: "image/jpeg", name: "car.jpg" } as any);
  return fetch(`${BACKEND_BASE}/member-cars/${carId}/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${_backendToken}` },
    body: form,
  });
}

// ── Member search ─────────────────────────────────────────────
export async function searchMembers(q: string) {
  const res = await fetch(`${BACKEND_BASE}/members/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

// ── Valet Staff ───────────────────────────────────────────────
export interface ZohoStaffRecord {
  id: string;
  Name: string;
  Staff_ID: string;
  PIN_Hash: string;
  Role: "Driver" | "Team Leader" | "Admin";
  Club_Location: string | null;
  Active: boolean;
}

export async function fetchValetStaff(): Promise<ZohoStaffRecord[]> {
  try {
    const data = await zohoFetch(
      "/Valet_Staff?fields=Name,Staff_ID,PIN_Hash,Role,Club_Location,Active&per_page=100"
    );
    return (data.data || []).filter((s: ZohoStaffRecord) => s.Active);
  } catch (e: any) {
    console.warn("fetchValetStaff:", e.message);
    return [];
  }
}

export async function debugZohoModules() {
  try {
    const data = await zohoFetch(`/settings/modules`);
    console.log("MODULES:", JSON.stringify((data.modules || []).map((m: any) => m.api_name)));
  } catch(e: any) {
    console.log("MODULES ERROR:", e.message);
  }
}

export async function debugContacts() {
  try {
    const data = await zohoFetch(`/Contacts?per_page=1`);
    console.log("CONTACT SAMPLE:", JSON.stringify(data?.data?.[0]));
  } catch(e: any) {
    console.log("CONTACTS ERROR:", e.message);
  }
}

export async function searchMembersZoho(q: string) {
  try {
    const data = await zohoFetch(`/Contacts/search?criteria=((Full_Name:contains:${encodeURIComponent(q)}))&fields=Full_Name,Email,Mobile,Membership_ID,Membership_Type,Account_Status,Valet_Parking_Cr_Balance&per_page=20`);
    return (data.data || []).map((c: any) => ({
      name: c.Full_Name, email: c.Email, mobile: c.Mobile,
      membershipId: c.Membership_ID,
      membershipType: c.Membership_Type || c.Account_Status || "Member",
      valetCredits: c.Valet_Parking_Cr_Balance,
    }));
  } catch(e: any) {
    console.warn("searchMembersZoho error:", e.message);
    return [];
  }
}

export async function searchMembersZoho2(q: string) {
  try {
    const encoded = encodeURIComponent(q);
    const data = await zohoFetch(`/Contacts/search?criteria=((Full_Name:contains:${encoded}))&fields=Full_Name,Email,Mobile,Membership_ID,Membership_Type,Account_Status,Valet_Parking_Cr_Balance&per_page=20`);
    return (data.data || []).map((c: any) => ({
      name: c.Full_Name, email: c.Email, mobile: c.Mobile,
      membershipId: c.Membership_ID,
      membershipType: c.Membership_Type || c.Account_Status || "Member",
      valetCredits: c.Valet_Parking_Cr_Balance ?? 0,
    }));
  } catch(e: any) {
    console.warn("searchMembersZoho2 error:", e.message);
    return [];
  }
}

export async function searchMembersZoho3(q: string) {
  try {
    const encoded = encodeURIComponent(q);
    const data = await zohoFetch(`/Contacts/search?word=${encoded}&fields=Full_Name,Email,Mobile,Membership_ID,Membership_Type,Account_Status,Valet_Parking_Cr_Balance&per_page=20`);
    console.log("SEARCH RAW:", JSON.stringify(data).slice(0, 300));
    return (data.data || []).map((c: any) => ({
      name: c.Full_Name, email: c.Email, mobile: c.Mobile,
      membershipId: c.Membership_ID,
      membershipType: c.Membership_Type || c.Account_Status || "Member",
      valetCredits: c.Valet_Parking_Cr_Balance ?? 0,
    }));
  } catch(e: any) {
    console.warn("searchMembersZoho3 error:", e.message);
    return [];
  }
}
