export type DayKey = "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun";

export type HoursMap = Partial<Record<DayKey, string[]>>; // e.g. ["10:00-21:00"]

export interface PickupConfig {
  enabled: boolean;
  minLeadMinutes: number;
  maxLeadMinutes: number;
  bufferMinutes: number;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface PaymentMethods {
  cash: boolean;
  cardInStore: boolean;
  online: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  photo?: string; // storage path or URL
  bio?: string;
}

export interface StoreDoc {
  name: string;
  timezone: string;       // e.g. "Australia/Sydney"
  online: boolean;
  phone?: string;
  address?: string;
  announcement?: string;
  hours?: HoursMap;
  pickup?: PickupConfig;
  social?: SocialLinks;
  payment?: PaymentMethods;
  staff?: StaffMember[];
  legal?: {
    termsUrl?: string;
    privacyUrl?: string;
  };
}

export interface StoreRecord extends StoreDoc {
  id: string;             // Firestore doc id (e.g. "MAIN")
}