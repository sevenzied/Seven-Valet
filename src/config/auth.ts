import * as Crypto from 'expo-crypto';

export const PIN_PEPPER = "SSH23245678942944";

export type Role = "Driver" | "Team Leader" | "Admin";

export interface StaffUser {
  id: string;
  staffId: string;
  name: string;
  role: Role;
  location: string;
  Club_Location: string | null;
  active: boolean;
  pinHash: string;
}

export async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    PIN_PEPPER + pin
  );
}

export async function verifyPin(typedPin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(typedPin);
  return hash.toLowerCase() === storedHash.toLowerCase();
}
