import { SHIFT_END, SHIFT_START } from './content';
import type { EmploymentState, EmploymentStatus, GameState } from './types';

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

export const calculateDifficulty = (minute: number): number => {
  const progress = clamp((minute - SHIFT_START) / (SHIFT_END - SHIFT_START), 0, 1);
  return Math.round(8 + 92 * Math.pow(progress, 1.35));
};

export const defaultEmploymentState = (): EmploymentState => ({
  risk: 8,
  status: 'secure',
  criticalMinutes: 0,
  firedReason: null,
});

export const employmentStatusForRisk = (risk: number): EmploymentStatus => {
  if (risk >= 100) return 'fired';
  if (risk >= 72) return 'probation';
  if (risk >= 52) return 'watch';
  return 'secure';
};

export const calculateEmploymentTargetRisk = (state: Readonly<GameState>): number => {
  const openTickets = state.tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'failed');
  const breached = state.tickets.filter((ticket) => ticket.slaBreached).length;
  const urgentOpen = openTickets.filter((ticket) => ticket.severity <= 2).length;
  const mistakes = state.technicians.reduce((sum, technician) => sum + technician.mistakes, 0);
  const averageStress = state.technicians.reduce((sum, technician) => sum + technician.stress, 0) / state.technicians.length;

  const metricRisk =
    Math.max(0, 98 - state.metrics.uptime) * 3.2 +
    Math.max(0, 72 - state.metrics.sla) * 0.7 +
    Math.max(0, 52 - state.metrics.security) * 0.75 +
    Math.max(0, 52 - state.metrics.executiveConfidence) * 1.0 +
    Math.max(0, 52 - state.metrics.userSatisfaction) * 0.7 +
    Math.max(0, 48 - state.metrics.reputation) * 0.8 +
    Math.max(0, 42 - state.metrics.morale) * 0.45;

  const operationalRisk =
    breached * 7 +
    urgentOpen * 4 +
    Math.max(0, openTickets.length - 6) * 2.2 +
    mistakes * 2.5 +
    Math.max(0, averageStress - 72) * 0.35;

  const progress = clamp((state.minute - SHIFT_START) / (SHIFT_END - SHIFT_START), 0, 1);
  const graceMultiplier = 0.35 + progress * 0.65;
  return clamp((metricRisk + operationalRisk) * graceMultiplier);
};

export const firingReason = (state: Readonly<GameState>): string => {
  const breached = state.tickets.filter((ticket) => ticket.slaBreached).length;
  const openUrgent = state.tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'failed' && ticket.severity <= 2).length;

  const candidates: ReadonlyArray<readonly [number, string]> = [
    [Math.max(0, 78 - state.metrics.uptime) * 4, 'Repeated outages made the department impossible to defend in the executive meeting.'],
    [Math.max(0, 22 - state.metrics.executiveConfidence) * 4, 'Executive confidence collapsed below the level normally reserved for vendor status pages.'],
    [Math.max(0, 20 - state.metrics.reputation) * 4, 'The department reputation fell far enough that “temporary leadership change” became permanent.'],
    [breached * 12, `${breached} SLA breaches turned the queue into evidence.`],
    [openUrgent * 10, `${openUrgent} urgent incidents remained open while leadership was counting consequences.`],
    [Math.max(0, 25 - state.metrics.security) * 3, 'Security posture deteriorated into a phrase legal requested be removed from the board deck.'],
  ];

  return [...candidates].sort((a, b) => b[0] - a[0])[0]?.[1]
    ?? 'The department failed too many visible measures at the same time.';
};
