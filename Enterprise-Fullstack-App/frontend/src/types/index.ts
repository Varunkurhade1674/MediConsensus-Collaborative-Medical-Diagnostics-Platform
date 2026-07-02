export interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin';
  hospital?: string;
  avatar?: string;
}

export interface Patient {
  _id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  bloodGroup: string;
  contactNumber?: string;
  medicalHistory?: string;
}

export interface Report {
  _id: string;
  patientId: Patient;
  uploaderId: {
    _id: string;
    name: string;
    email: string;
    hospital?: string;
  };
  fileName: string;
  fileUrl: string;
  fileType: string;
  ocrText?: string;
  summary?: string;
  tags: string[];
  status: 'pending' | 'processing' | 'complete' | 'failed';
  createdAt: string;
}

export interface AIResult {
  _id: string;
  reportId: string;
  modelName: string;
  diagnosis: string;
  probability: number;
  confidence: number;
  reasoningSummary: string;
  treatmentSuggestion: string;
  evidence: string;
  references: string[];
}

export interface FindingsMatch {
  finding: string;
  agreeingModels: string[];
  disagreeingModels: string[];
}

export interface Disagreement {
  topic: string;
  description: string;
}

export interface ConsensusReport {
  _id: string;
  reportId: string;
  consensusScore: number;
  agreementScore: number;
  findingsMatch: FindingsMatch[];
  disagreements: Disagreement[];
  missingFindings: string[];
  medicalRisks: string[];
  recommendations: string;
  doctorOverride?: string;
  status: 'automatic' | 'overridden';
  reviewerId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface Comment {
  _id: string;
  reportId: string;
  authorId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    hospital?: string;
  };
  text: string;
  parentId: string | null;
  mentions: string[];
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: {
    name: string;
    email: string;
    hospital?: string;
  };
  action: string;
  details: string;
  timestamp: string;
}
