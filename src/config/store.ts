// ─────────────────────────────────────────────────────────────
//  SEVEN VALET — Live Request Store
//  Polls Zoho CRM Valet_Parkings every 8 seconds
//  Maps Zoho records → app ValetRequest objects
// ─────────────────────────────────────────────────────────────

import { fetchValetRequests, ZOHO_TO_APP, ZohoValetRecord } from "./api";

export type RequestStatus =
  | "pending" | "accepted" | "parking" | "parked"
  | "retrieving" | "ready" | "completed";

export interface ValetRequest {
  _localId: string;         // Zoho record ID
  zohoId: string;           // Zoho record ID (same, for API calls)
  memberId: string;
  memberName: string;
  membershipTier: string;
  memberCarId: string;
  parkingId: string | null;
  plate: string;
  carLabel: string;
  status: RequestStatus;
  time: string;
  createdAt: number;
  updatedAt?: string;
  includeCarWash: boolean;
  spot?: string;
  photoUri?: string;
  driverId?: string;
  driverName?: string;
  brand: string;
  location: string;
  credits?: number;
  // local-only override — driver accepted/started but not yet synced back
  _localStatus?: RequestStatus;
}

type Listener = (requests: ValetRequest[]) => void;

let _requests: ValetRequest[] = [];
let _polling: ReturnType<typeof setInterval> | null = null;
const _listeners = new Set<Listener>();

// Convert a Zoho record to our app format
function zohoToRequest(z: ZohoValetRecord): ValetRequest {
  const appStatus = (ZOHO_TO_APP[z.Status] || "pending") as RequestStatus;
  const createdAt = z.Created_Time ? new Date(z.Created_Time).getTime() : Date.now();
  const time = new Date(createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    _localId: z.id,
    zohoId:   z.id,
    memberId:      z.Member_Name?.id || "",
    memberName:    z.Member_Name?.name || "Unknown Member",
    membershipTier: z.Membership_Type_Valet_Parking?.name || "Member",
    memberCarId:   z.Member_Car_Name?.id || "",
    parkingId:     z.id,
    plate:         z.Plate_Number || "—",
    carLabel:      z.Member_Car_Name?.name || "Vehicle",
    status:        appStatus,
    time,
    createdAt,
    includeCarWash: false,
    spot:          z.Parking_Location || undefined,
    brand:         "Seven",
    location:      z.Club_Location_Valet_Parking?.name || "Dubai",
  };
}

export const RequestStore = {
  getAll: () => [..._requests],

  // Start polling Zoho every 8 seconds
  startPolling: () => {
    if (_polling) return;
    RequestStore._sync(); // immediate first fetch
    _polling = setInterval(() => RequestStore._sync(), 8000);
  },

  stopPolling: () => {
    if (_polling) { clearInterval(_polling); _polling = null; }
  },

  // Sync from Zoho
  _sync: async () => {
    try {
      const zohoRecords = await fetchValetRequests();
      const incoming = zohoRecords.map(zohoToRequest);

      // Preserve local status overrides (e.g. driver accepted but Zoho not updated yet)
      const merged = incoming.map(incoming => {
        const existing = _requests.find(r => r._localId === incoming._localId);
        if (existing?._localStatus) {
          return { ...incoming, status: existing._localStatus, _localStatus: existing._localStatus };
        }
        return incoming;
      });

      _requests = merged;
      RequestStore._emit();
    } catch (e: any) {
      console.warn("Zoho sync failed:", e.message);
    }
  },

  // Local optimistic update (shown immediately, confirmed on next poll)
  update: (localId: string, patch: Partial<ValetRequest> & { _localStatus?: RequestStatus }) => {
    _requests = _requests.map(r =>
      r._localId === localId
        ? {
            ...r,
            ...patch,
            updatedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          }
        : r
    );
    RequestStore._emit();
  },

  // Clear local status override once Zoho confirms
  clearLocalStatus: (localId: string) => {
    _requests = _requests.map(r =>
      r._localId === localId ? { ...r, _localStatus: undefined } : r
    );
  },

  // Add a purely local request (for demo/testing only)
  addLocal: (req: ValetRequest) => {
    _requests = [req, ..._requests];
    RequestStore._emit();
  },

  subscribe: (fn: Listener) => {
    _listeners.add(fn);
    fn([..._requests]); // immediately call with current state
    return () => _listeners.delete(fn);
  },

  _emit: () => {
    const snap = [..._requests];
    _listeners.forEach(fn => fn(snap));
  },
};
