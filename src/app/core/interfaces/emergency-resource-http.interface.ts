export interface EmergencyResource {
  id: string;
  userId: string;
  name: string;
  description: string;
  resourceUrl?: string;
  contacts: string[];
  links: string[];
  status: string;
  createdDate: string;
  modifiedDate: string;
}

export interface EmergencyResourceStats {
  totalResources: number;
  activeEmergencies: number;
  totalContacts: number;
  totalLinks: number;
  totalAccesses: number;
}
