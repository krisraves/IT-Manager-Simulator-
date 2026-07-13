export type TicketCategory = 'hardware' | 'network' | 'identity' | 'security' | 'software';
export type TicketSeverity = 1 | 2 | 3 | 4;
export type TicketStatus = 'unassigned' | 'active' | 'resolved' | 'failed';
export type Trait = 'wizard' | 'friendly' | 'junior' | 'burned-out' | 'security-first' | 'cowboy';
export type EmploymentStatus = 'secure' | 'watch' | 'probation' | 'fired';

export interface Skills {
  readonly hardware: number;
  readonly network: number;
  readonly identity: number;
  readonly security: number;
  readonly software: number;
}

export interface Technician {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly color: number;
  readonly traits: readonly Trait[];
  readonly skills: Skills;
  readonly speed: number;
  readonly accuracy: number;
  readonly communication: number;
  morale: number;
  stress: number;
  fatigue: number;
  training: number;
  currentTicketId: string | null;
  mistakes: number;
  resolvedToday: number;
}

export interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly requester: string;
  readonly category: TicketCategory;
  readonly severity: TicketSeverity;
  readonly businessImpact: number;
  readonly requiredSkill: number;
  readonly effort: number;
  readonly hiddenComplexity: number;
  readonly securityRisk: number;
  readonly createdMinute: number;
  readonly slaDueMinute: number;
  remaining: number;
  status: TicketStatus;
  assignedTo: string | null;
  escalationLevel: number;
  slaBreached: boolean;
  resolutionNote: string | null;
}

export interface Metrics {
  uptime: number;
  sla: number;
  security: number;
  morale: number;
  budget: number;
  executiveConfidence: number;
  userSatisfaction: number;
  technicalDebt: number;
  reputation: number;
}

export interface EmploymentState {
  risk: number;
  status: EmploymentStatus;
  criticalMinutes: number;
  firedReason: string | null;
}

export interface EventLogEntry {
  readonly id: number;
  readonly minute: number;
  readonly tone: 'info' | 'good' | 'warning' | 'bad';
  readonly message: string;
}

export interface DecisionOption {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export interface PendingDecision {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly options: readonly DecisionOption[];
}

export interface GameState {
  readonly version: 1;
  readonly seed: number;
  rngState: number;
  day: number;
  minute: number;
  dayEnded: boolean;
  score: number | null;
  difficulty: number;
  employment: EmploymentState;
  metrics: Metrics;
  technicians: Technician[];
  tickets: Ticket[];
  log: EventLogEntry[];
  pendingDecision: PendingDecision | null;
  scriptedFlags: Record<string, boolean>;
  nextTicketNumber: number;
  nextLogId: number;
}

export interface DaySummary {
  readonly score: number;
  readonly grade: string;
  readonly resolved: number;
  readonly breached: number;
  readonly backlog: number;
  readonly headline: string;
}

export type SimulationEvent =
  | { readonly type: 'state-changed'; readonly state: GameState }
  | { readonly type: 'toast'; readonly tone: EventLogEntry['tone']; readonly message: string }
  | { readonly type: 'decision'; readonly decision: PendingDecision }
  | { readonly type: 'employment-warning'; readonly status: Exclude<EmploymentStatus, 'secure' | 'fired'>; readonly risk: number; readonly message: string }
  | { readonly type: 'fired'; readonly reason: string; readonly risk: number }
  | { readonly type: 'day-ended'; readonly summary: DaySummary };
