
import * as Icons from 'lucide-react';
import {
  Activity, LayoutDashboard, Monitor, HelpCircle, Users
} from 'lucide-react';

export const DEFAULT_SERVICES = [
  {
    id: 'aadhaar',
    name: 'Aadhaar & Identity',
    description: 'Aadhaar enrollment, updates, and identity verification.',
    icon: 'Fingerprint',
    color: '#3b82f6',
    prefix: 'I',
    avgTimeMinutes: 15,
    isActive: true,
    subServices: ['New Enrollment', 'Address Update', 'Biometric Update', 'Phone Number Link']
  },
  {
    id: 'revenue',
    name: 'Revenue & Land',
    description: 'Property registration, land records, and revenue collection.',
    icon: 'Home',
    color: '#8b5cf6',
    prefix: 'R',
    avgTimeMinutes: 30,
    isActive: true,
    subServices: ['Property Registration', 'Land Records', 'Mutation of Property', 'Revenue Tax']
  },
  {
    id: 'vehicle',
    name: 'Vehicle & Transport',
    description: 'Driving licensing, vehicle registration, and permits.',
    icon: 'Car',
    color: '#f97316',
    prefix: 'V',
    avgTimeMinutes: 20,
    isActive: true,
    subServices: ['New Driving License', 'License Renewal', 'Vehicle Registration', 'Transfer of Ownership']
  },
  {
    id: 'cert',
    name: 'Certificate Services',
    description: 'Birth, death, marriage, and institutional certifications.',
    icon: 'FileText',
    color: '#6366f1',
    prefix: 'C',
    avgTimeMinutes: 15,
    isActive: true,
    subServices: ['Birth Certificate', 'Death Certificate', 'Marriage Certificate', 'Caste Certificate', 'Income Certificate']
  },
  {
    id: 'health',
    name: 'Health & Sanitation',
    description: 'Medical assistance, sanitation requests, and health schemes.',
    icon: 'Activity',
    color: '#ec4899',
    prefix: 'H',
    avgTimeMinutes: 25,
    isActive: true,
    subServices: ['Health Card Issuance', 'Medical Relief Scheme', 'Sanitation Complaint', 'Hospital Allocation']
  },
  {
    id: 'pension',
    name: 'Pension & Welfare',
    description: 'Senior citizen pension, widow pension, and welfare.',
    icon: 'Heart',
    color: '#14b8a6',
    prefix: 'P',
    avgTimeMinutes: 10,
    isActive: true,
    subServices: ['Senior Citizen Pension', 'Widow Pension', 'Disability Welfare', 'Verification Check']
  },
  {
    id: 'education',
    name: 'Education & Grants',
    description: 'Scholarships, school admissions, and educational grants.',
    icon: 'GraduationCap',
    color: '#a855f7',
    prefix: 'E',
    avgTimeMinutes: 15,
    isActive: true,
    subServices: ['Scholarship Application', 'School Transfer Cert', 'Grant Disbursement', 'Exam Form Submission']
  },
  {
    id: 'bill',
    name: 'Bill Payments',
    description: 'Utility and tax payments.',
    icon: 'CreditCard',
    color: '#10b981',
    prefix: 'B',
    avgTimeMinutes: 5,
    isActive: true,
    subServices: ['Electricity Bill', 'Water Tax', 'Property Tax', 'Municipal Fees']
  },
  {
    id: 'comp',
    name: 'Grievance & Complaints',
    description: 'Lodge formal complaints and feedback.',
    icon: 'MessageSquare',
    color: '#f59e0b',
    prefix: 'G',
    avgTimeMinutes: 20,
    isActive: true,
    subServices: ['Road & Infrastructure', 'Sanitation', 'Street Lighting', 'Public Nuisance']
  },
  {
    id: 'appr',
    name: 'Applications & Approvals',
    description: 'Permits and licenses.',
    icon: 'CheckCircle',
    color: '#3b82f6',
    prefix: 'A',
    avgTimeMinutes: 25,
    isActive: true,
    subServices: ['Trade License', 'Building Permit', 'Driving License Verification', 'Passport Clearance']
  },
  {
    id: 'legal',
    name: 'Administrative',
    description: 'Notarization, affidavits, and official stamp duty.',
    icon: 'Landmark',
    color: '#0f766e',
    prefix: 'L',
    avgTimeMinutes: 10,
    isActive: true,
    subServices: ['Document Notarization', 'Affidavit Attestation', 'Stamp Duty Payment', 'Signature Verification', 'Certified Copies']
  }
];

export const getIcon = (name: string, className?: string) => {
  const IconComponent = (Icons as any)[name];
  return IconComponent ? <IconComponent className={className} /> : <Icons.HelpCircle className={className} />;
};

export const INITIAL_COUNTERS = [
  { id: 1, officerName: 'John Doe', name: 'Registry Desk 1', status: 'ONLINE', isOnline: true, assignedServices: ['Certificate Services'] },
  { id: 2, officerName: 'Jane Smith', name: 'Payment Window 2', status: 'ONLINE', isOnline: true, assignedServices: ['Bill Payments'] },
  { id: 3, officerName: 'Robert Wilson', name: 'Documentation Desk 3', status: 'ONLINE', isOnline: true, assignedServices: ['Grievance & Complaints'] },
  { id: 4, officerName: 'Maria Garcia', name: 'Applications & Approvals 4', status: 'ONLINE', isOnline: true, assignedServices: ['Applications & Approvals'] },
];

export const NAV_ITEMS = [
  { id: 'citizen', label: 'Citizen Portal', icon: <Users className="w-5 h-5" /> },
  { id: 'officer', label: 'Officer Panel', icon: <Activity className="w-5 h-5" /> },
  { id: 'admin', label: 'Command Center', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'display', label: 'Public Display', icon: <Monitor className="w-5 h-5" /> },
  { id: 'help', label: 'Knowledge Base', icon: <HelpCircle className="w-5 h-5" /> },
];
