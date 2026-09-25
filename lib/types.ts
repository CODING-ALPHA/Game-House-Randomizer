export interface Group {
  name: string;
  colorHex: string;
  emoji?: string;
  whatsappLink?: string;
}
export interface RegistrationField {
  name: string;
  type: "text" | "email" | "number" | "select";
  required: boolean;
  isUniqueIdentifier?: boolean;
  options?: string[];
  regexValidation?: string;
  errorMessage?: string;
}
export interface PublicGame {
  name: string;
  slug: string;
  description: string;
  themeColor: string;
  themeSecondaryColor?: string;
  registrationOpen: boolean;
  closedMessage: string;
  groups: Group[];
  registrationFields: RegistrationField[];
}
export interface DashboardData {
  game: PublicGame;
  totalParticipants: number;
  groupCounts: { _id: string; count: number }[];
}

export interface ParticipantRecord {
  _id: string;
  name: string;
  groupName: string;
  data: Record<string, string>;
  createdAt: string;
}
