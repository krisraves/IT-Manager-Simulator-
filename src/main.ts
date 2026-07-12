import './styles.css';
import './mobile.css';
import './assignment-menu.css';
import { SaveStore } from './core/save';
import { Simulation } from './core/simulation';
import type { DaySummary, GameState } from './core/types';
import { MobileControls } from './mobile';
import { OfficeWorld } from './render/world';
import { GameInterface } from './ui/interface';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app root element. The office has been reorganized without notice.');

const saveStore = new SaveStore();
let simulation = new Simulation();
let speed = 1;
let world: OfficeWorld;
let ui: GameInterface;
let mobileControls: MobileControls | null = null;
let lastAutosaveMinute = simulation.getState().minute;

const safely = (action: () => void): void => {
  try {
    action();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown management failure occurred.';
    ui.showToast('bad', message);
  }
};

const performInteraction = (): void => {
  const target = world.interact();
  if (target) ui.showDialogue(simulation.interact(target));
  else ui.showToast('info', 'Move closer and aim at something capable of generating a ticket.');
};

const bindSimulation = (): void => {
  simulation.subscribe((event) => {
    if (event.type === 'state-changed') {
      ui.render(event.state);
      world.updateState(event.state);
      world.setInputEnabled(!ui.isPanelVisible() && !event.state.pendingDecision && !event.state.dayEnded);
      if (event.state.minute - lastAutosaveMinute >= 15 || event.state.dayEnded) {
        lastAutosaveMinute = event.state.minute;
        void saveStore.save(simulation.snapshot());
      }
    } else if (event.type === 'toast') {
      ui.showToast(event.tone, event.message);
    } else if (event.type === 'day-ended') {
      handleDayEnded(event.summary);
    }
  });
};

const loadState = async (): Promise<void> => {
  const state = await saveStore.load();
  if (!state) {
    ui.showToast('warning', 'No save found. Even the backups have boundaries.');
    return;
  }
  simulation.replaceState(state);
  lastAutosaveMinute = state.minute;
  ui.showToast('good', 'Saved shift restored. Consequences included.');
  if (state.dayEnded && state.score !== null) ui.showSummary(summaryFromState(state));
};

const summaryFromState = (state: Readonly<GameState>): DaySummary => {
  const resolved = state.tickets.filter((ticket) => ticket.status === 'resolved').length;
  const breached = state.tickets.filter((ticket) => ticket.slaBreached).length;
  const backlog = state.tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'failed').length;
  const score = state.score ?? 0;
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 68 ? 'C' : score >= 55 ? 'D' : 'F';
  return { score, grade, resolved, breached, backlog, headline: state.log[0]?.message ?? 'The shift ended.' };
};

const handleDayEnded = (summary: DaySummary): void => {
  speed = 0;
  ui.setSimulationSpeed(0);
  mobileControls?.setSpeed(0);
  world.setInputEnabled(false);
  ui.showSummary(summary);
  void saveStore.save(simulation.snapshot());
};

ui = new GameInterface(app, simulation.getState(), {
  onAssign: (ticketId, technicianId) => safely(() => simulation.assignTicket(ticketId, technicianId)),
  onTrain: (technicianId) => safely(() => simulation.trainTechnician(technicianId)),
  onPurchase: (upgradeId) => safely(() => simulation.purchaseUpgrade(upgradeId)),
  onDecision: (optionId) => safely(() => simulation.chooseDecision(optionId)),
  onSave: () => {
    void saveStore.save(simulation.snapshot()).then(
      () => ui.showToast('good', 'Shift saved.'),
      () => ui.showToast('bad', 'Save failed. A surprisingly authentic feature.'),
    );
  },
  onLoad: () => { void loadState(); },
  onEndDay: () => safely(() => { simulation.endDay(); }),
  onNewDay: () => { window.location.reload(); },
  onSpeedChange: (nextSpeed) => {
    speed = nextSpeed;
    mobileControls?.setSpeed(nextSpeed);
  },
  onPanelVisibilityChange: (visible) => {
    const state = simulation.getState();
    world?.setInputEnabled(!visible && !state.pendingDecision && !state.dayEnded);
    mobileControls?.setPanelOpen(visible);
  },
  onStart: () => world.requestPointerLock(),
});

const worldHost = document.getElementById('world-host');
if (!worldHost) throw new Error('Missing world host. Facilities denies moving it.');
world = new OfficeWorld(worldHost, simulation.getState().technicians, {
  onTargetChanged: (label) => ui.setInteractionLabel(label),
});
world.updateState(simulation.getState());

mobileControls = new MobileControls(world, ui, {
  onInteract: performInteraction,
  onSpeedChange: (nextSpeed) => {
    speed = nextSpeed;
    ui.setSimulationSpeed(nextSpeed);
  },
});
mobileControls.setPanelOpen(ui.isPanelVisible());
mobileControls.setSpeed(speed);
bindSimulation();

window.addEventListener('keydown', (event) => {
  if (event.code === 'Tab') {
    event.preventDefault();
    ui.togglePanel();
    return;
  }
  if (event.code === 'KeyE' && !event.repeat && world.isPointerLocked()) performInteraction();
});

window.setInterval(() => {
  const state = simulation.getState();
  if (speed <= 0 || state.dayEnded || state.pendingDecision) return;
  simulation.tick(speed);
}, 1_000);
