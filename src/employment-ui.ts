import type { GameState } from './core/types';

export class EmploymentUi {
  private readonly root: HTMLElement;
  private readonly warning: HTMLElement;
  private readonly warningTitle: HTMLElement;
  private readonly warningMessage: HTMLElement;
  private readonly warningRisk: HTMLElement;
  private readonly warningBar: HTMLElement;
  private readonly firedModal: HTMLElement;
  private firedShown = false;

  public constructor() {
    document.body.insertAdjacentHTML('beforeend', `
      <section id="employment-warning" class="employment-warning" hidden role="alert" aria-live="assertive">
        <div class="employment-warning-copy">
          <strong id="employment-warning-title">JOB SECURITY WARNING</strong>
          <span id="employment-warning-message">Performance is under review.</span>
        </div>
        <div class="employment-risk-meter" aria-label="Employment risk">
          <span id="employment-warning-risk">0%</span>
          <i><b id="employment-warning-bar"></b></i>
        </div>
      </section>
      <div id="fired-modal" class="modal-layer fired-layer" hidden>
        <section class="modal-card fired-card" role="dialog" aria-modal="true" aria-labelledby="fired-title">
          <p class="eyebrow">EMPLOYMENT STATUS UPDATE</p>
          <div class="fired-stamp">TERMINATED</div>
          <h2 id="fired-title">You have been fired.</h2>
          <p id="fired-reason"></p>
          <div class="fired-metrics" id="fired-metrics"></div>
          <p class="fired-note">Your access has been disabled. The printer remains employed.</p>
          <button type="button" id="fired-new-game" class="primary-button">Start a new game</button>
        </section>
      </div>`);

    this.root = this.requireElement('employment-warning');
    this.warning = this.root;
    this.warningTitle = this.requireElement('employment-warning-title');
    this.warningMessage = this.requireElement('employment-warning-message');
    this.warningRisk = this.requireElement('employment-warning-risk');
    this.warningBar = this.requireElement('employment-warning-bar');
    this.firedModal = this.requireElement('fired-modal');
    this.requireElement<HTMLButtonElement>('fired-new-game').addEventListener('click', () => window.location.reload());
  }

  public render(state: Readonly<GameState>): void {
    this.renderWarning(state);
    if (state.employment.status === 'fired') this.showFired(state);
  }

  private renderWarning(state: Readonly<GameState>): void {
    const status = state.employment.status;
    if (status === 'secure' || status === 'fired') {
      this.warning.hidden = true;
      this.warning.className = 'employment-warning';
      return;
    }

    const risk = Math.round(state.employment.risk);
    this.warning.hidden = false;
    this.warning.className = `employment-warning ${status}`;
    this.warningRisk.textContent = `${risk}%`;
    this.warningBar.style.width = `${risk}%`;

    if (status === 'probation') {
      this.warningTitle.textContent = 'FINAL WARNING — TERMINATION RISK';
      this.warningMessage.textContent = 'Recover uptime, SLA performance, reputation, and executive confidence immediately.';
    } else {
      this.warningTitle.textContent = 'JOB SECURITY WARNING';
      this.warningMessage.textContent = 'Department performance is attracting executive attention. This is not the useful kind.';
    }
  }

  private showFired(state: Readonly<GameState>): void {
    if (this.firedShown) return;
    this.firedShown = true;
    this.firedModal.hidden = false;
    document.body.classList.add('player-fired');
    this.requireElement('fired-reason').textContent = state.employment.firedReason ?? 'The department failed too many visible measures at once.';

    const breached = state.tickets.filter((ticket) => ticket.slaBreached).length;
    const backlog = state.tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'failed').length;
    const resolved = state.tickets.filter((ticket) => ticket.status === 'resolved').length;
    this.requireElement('fired-metrics').innerHTML = `
      <div><strong>${resolved}</strong><span>Resolved</span></div>
      <div><strong>${breached}</strong><span>SLA breaches</span></div>
      <div><strong>${backlog}</strong><span>Backlog</span></div>
      <div><strong>${Math.round(state.metrics.executiveConfidence)}</strong><span>Executive confidence</span></div>`;
  }

  private requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing employment UI element: ${id}`);
    return element as T;
  }
}
