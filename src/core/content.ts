import type { PendingDecision, Technician, Ticket, TicketCategory, TicketSeverity } from './types';

export const SHIFT_START = 8 * 60 + 30;
export const SHIFT_END = 17 * 60;

export const createTechnicians = (): Technician[] => [
  {
    id: 'maya', name: 'Maya Chen', role: 'Senior Systems Engineer', color: 0x5ab0ff,
    traits: ['wizard', 'burned-out'],
    skills: { hardware: 6, network: 9, identity: 7, security: 8, software: 8 },
    speed: 8, accuracy: 8, communication: 3,
    morale: 58, stress: 42, fatigue: 25, training: 0, currentTicketId: null, mistakes: 0, resolvedToday: 0,
  },
  {
    id: 'leo', name: 'Leo Alvarez', role: 'Desktop Support Technician', color: 0x66d18f,
    traits: ['friendly'],
    skills: { hardware: 8, network: 4, identity: 6, security: 3, software: 6 },
    speed: 6, accuracy: 6, communication: 9,
    morale: 78, stress: 20, fatigue: 10, training: 0, currentTicketId: null, mistakes: 0, resolvedToday: 0,
  },
  {
    id: 'priya', name: 'Priya Shah', role: 'Security Analyst', color: 0xf0a65a,
    traits: ['security-first'],
    skills: { hardware: 3, network: 7, identity: 8, security: 10, software: 6 },
    speed: 5, accuracy: 10, communication: 6,
    morale: 72, stress: 28, fatigue: 12, training: 0, currentTicketId: null, mistakes: 0, resolvedToday: 0,
  },
  {
    id: 'nate', name: 'Nate Brooks', role: 'Junior IT Technician', color: 0xc783ff,
    traits: ['junior', 'cowboy'],
    skills: { hardware: 5, network: 3, identity: 4, security: 2, software: 5 },
    speed: 7, accuracy: 4, communication: 5,
    morale: 86, stress: 12, fatigue: 8, training: 20, currentTicketId: null, mistakes: 0, resolvedToday: 0,
  },
];

export interface TicketTemplate {
  readonly title: string;
  readonly requester: string;
  readonly category: TicketCategory;
  readonly severity: TicketSeverity;
  readonly impact: number;
  readonly skill: number;
  readonly effort: number;
  readonly complexity: number;
  readonly securityRisk: number;
  readonly slaMinutes: number;
}

export interface TicketTuning {
  readonly effortMultiplier?: number;
  readonly complexityMultiplier?: number;
  readonly slaMultiplier?: number;
  readonly skillDelta?: number;
  readonly severityDelta?: number;
  readonly impactMultiplier?: number;
  readonly securityRiskMultiplier?: number;
}

export const INITIAL_TICKETS: readonly TicketTemplate[] = [
  { title: 'VPN says “no” from home', requester: 'Sales', category: 'network', severity: 3, impact: 45, skill: 5, effort: 50, complexity: 8, securityRisk: 4, slaMinutes: 150 },
  { title: 'CEO deck will not print', requester: 'Executive Office', category: 'hardware', severity: 2, impact: 65, skill: 4, effort: 35, complexity: 4, securityRisk: 0, slaMinutes: 90 },
  { title: 'New hire has no accounts', requester: 'People Ops', category: 'identity', severity: 3, impact: 40, skill: 5, effort: 55, complexity: 8, securityRisk: 6, slaMinutes: 180 },
  { title: 'Production certificate expires today', requester: 'Platform Engineering', category: 'security', severity: 1, impact: 95, skill: 8, effort: 95, complexity: 20, securityRisk: 30, slaMinutes: 210 },
  { title: 'Laptop fan sounds legally actionable', requester: 'Finance', category: 'hardware', severity: 4, impact: 18, skill: 4, effort: 45, complexity: 12, securityRisk: 0, slaMinutes: 300 },
];

export const RANDOM_TICKETS: readonly TicketTemplate[] = [
  { title: 'Password reset, but make it urgent', requester: 'Marketing', category: 'identity', severity: 4, impact: 16, skill: 2, effort: 24, complexity: 2, securityRisk: 2, slaMinutes: 180 },
  { title: 'Conference room display is spiritually disconnected', requester: 'Operations', category: 'hardware', severity: 3, impact: 32, skill: 4, effort: 38, complexity: 8, securityRisk: 0, slaMinutes: 180 },
  { title: 'Spreadsheet add-in vanished after update', requester: 'Finance', category: 'software', severity: 3, impact: 35, skill: 5, effort: 52, complexity: 10, securityRisk: 1, slaMinutes: 210 },
  { title: 'Wi-Fi slow near the expensive couch', requester: 'Product', category: 'network', severity: 3, impact: 38, skill: 6, effort: 60, complexity: 14, securityRisk: 2, slaMinutes: 210 },
  { title: 'Unknown browser extension deployed itself', requester: 'Security', category: 'security', severity: 2, impact: 58, skill: 7, effort: 72, complexity: 16, securityRisk: 24, slaMinutes: 135 },
  { title: 'Shared mailbox permissions are interpretive', requester: 'Support', category: 'identity', severity: 3, impact: 40, skill: 6, effort: 55, complexity: 10, securityRisk: 5, slaMinutes: 180 },
];

export const createTicket = (
  template: TicketTemplate,
  id: string,
  createdMinute: number,
  tuning: TicketTuning = {},
): Ticket => {
  const effort = Math.max(8, Math.round(template.effort * (tuning.effortMultiplier ?? 1)));
  const complexity = Math.max(0, Math.round(template.complexity * (tuning.complexityMultiplier ?? 1)));
  const severity = Math.min(4, Math.max(1, template.severity + (tuning.severityDelta ?? 0))) as TicketSeverity;
  const skill = Math.min(10, Math.max(1, Math.round(template.skill + (tuning.skillDelta ?? 0))));
  const impact = Math.min(100, Math.max(1, Math.round(template.impact * (tuning.impactMultiplier ?? 1))));
  const securityRisk = Math.min(100, Math.max(0, Math.round(template.securityRisk * (tuning.securityRiskMultiplier ?? 1))));
  const slaMinutes = Math.max(45, Math.round(template.slaMinutes * (tuning.slaMultiplier ?? 1)));

  return {
    id,
    title: template.title,
    requester: template.requester,
    category: template.category,
    severity,
    businessImpact: impact,
    requiredSkill: skill,
    effort,
    hiddenComplexity: complexity,
    securityRisk,
    createdMinute,
    slaDueMinute: createdMinute + slaMinutes,
    remaining: effort + complexity,
    status: 'unassigned',
    assignedTo: null,
    escalationLevel: 0,
    slaBreached: false,
    resolutionNote: null,
  };
};

export const DECISIONS: Readonly<Record<string, PendingDecision>> = {
  shadowIt: {
    id: 'shadow-it',
    title: 'Shadow IT Detected',
    body: 'Product connected an unapproved AI meeting bot to every calendar. It requests mailbox access, recording access, and apparently dominion over the moon.',
    options: [
      { id: 'block', label: 'Block it now', detail: '+Security, -executive confidence, creates cleanup work' },
      { id: 'pilot', label: 'Permit a controlled pilot', detail: 'Costs budget and time, smaller security gain' },
      { id: 'ignore', label: 'Ignore until after launch', detail: '+confidence now, substantial security risk later' },
    ],
  },
  vendorOutage: {
    id: 'vendor-outage',
    title: 'Identity Vendor Outage',
    body: 'The status page says “operational.” Employees say otherwise. The vendor support chatbot has suggested clearing cookies, which is how civilizations end.',
    options: [
      { id: 'failover', label: 'Enable costly failover', detail: '-$1,800, protects uptime and users' },
      { id: 'manual', label: 'Run manual access process', detail: 'Heavy technician stress, partial continuity' },
      { id: 'wait', label: 'Wait for vendor recovery', detail: 'No cost, major uptime and confidence hit' },
    ],
  },
};
