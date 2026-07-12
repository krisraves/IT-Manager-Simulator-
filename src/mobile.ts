import type { OfficeWorld } from './render/world';
import type { GameInterface } from './ui/interface';

export type DisplayMode = 'auto' | 'mobile' | 'desktop';

export interface MobileControlCallbacks {
  readonly onInteract: () => void;
  readonly onSpeedChange: (speed: number) => void;
}

const STORAGE_KEY = 'it-manager-display-mode';
const DISPLAY_MODES: readonly DisplayMode[] = ['auto', 'mobile', 'desktop'];
const SPEEDS = [0, 1, 4] as const;

const isDisplayMode = (value: string | null): value is DisplayMode =>
  value === 'auto' || value === 'mobile' || value === 'desktop';

export class MobileControls {
  private readonly world: OfficeWorld;
  private readonly ui: GameInterface;
  private readonly callbacks: MobileControlCallbacks;
  private readonly coarsePointer = window.matchMedia('(pointer: coarse)');
  private readonly noHover = window.matchMedia('(hover: none)');
  private readonly root: HTMLElement;
  private readonly movePad: HTMLElement;
  private readonly moveKnob: HTMLElement;
  private readonly lookZone: HTMLElement;
  private readonly interactButton: HTMLButtonElement;
  private readonly consoleButton: HTMLButtonElement;
  private readonly speedButton: HTMLButtonElement;
  private readonly modeButton: HTMLButtonElement;
  private readonly orientationHint: HTMLElement;
  private mode: DisplayMode = this.readMode();
  private active = false;
  private panelOpen = true;
  private speed = 1;
  private movePointerId: number | null = null;
  private lookPointerId: number | null = null;
  private lastLookX = 0;
  private lastLookY = 0;

  public constructor(world: OfficeWorld, ui: GameInterface, callbacks: MobileControlCallbacks) {
    this.world = world;
    this.ui = ui;
    this.callbacks = callbacks;
    this.buildMarkup();
    this.root = this.requireElement('mobile-controls');
    this.movePad = this.requireElement('mobile-move-pad');
    this.moveKnob = this.requireElement('mobile-move-knob');
    this.lookZone = this.requireElement('mobile-look-zone');
    this.interactButton = this.requireElement<HTMLButtonElement>('mobile-interact');
    this.consoleButton = this.requireElement<HTMLButtonElement>('mobile-console');
    this.speedButton = this.requireElement<HTMLButtonElement>('mobile-speed');
    this.modeButton = this.requireElement<HTMLButtonElement>('display-mode-toggle');
    this.orientationHint = this.requireElement('orientation-hint');
    this.bindEvents();
    this.applyMode();
  }

  public setPanelOpen(open: boolean): void {
    this.panelOpen = open;
    this.root.classList.toggle('panel-open', open);
    document.body.classList.toggle('console-open', this.active && open);
    document.documentElement.classList.toggle('console-open', this.active && open);
    this.consoleButton.textContent = open ? 'CLOSE' : 'CONSOLE';
    if (open) this.resetMoveControl();
    this.updateOrientationHint();
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
    this.speedButton.textContent = speed === 0 ? 'PAUSED' : `${speed}×`;
    this.speedButton.setAttribute('aria-label', speed === 0 ? 'Simulation paused' : `Simulation speed ${speed} times`);
  }

  public isMobileMode(): boolean {
    return this.active;
  }

  public destroy(): void {
    window.removeEventListener('resize', this.onEnvironmentChanged);
    window.removeEventListener('orientationchange', this.onEnvironmentChanged);
    this.coarsePointer.removeEventListener('change', this.onEnvironmentChanged);
    this.noHover.removeEventListener('change', this.onEnvironmentChanged);
    this.root.remove();
    this.modeButton.remove();
    this.orientationHint.remove();
    document.body.classList.remove('mobile-mode', 'console-open');
    document.documentElement.classList.remove('mobile-mode', 'console-open');
  }

  private buildMarkup(): void {
    document.body.insertAdjacentHTML('beforeend', `
      <button id="display-mode-toggle" type="button" aria-label="Change display control mode">DISPLAY: AUTO</button>
      <div id="orientation-hint" role="status" hidden>Landscape gives the office more room to disappoint you.</div>
      <div id="mobile-controls" hidden aria-label="Touch controls">
        <div id="mobile-look-zone" aria-label="Drag to look around"></div>
        <div id="mobile-move-pad" aria-label="Virtual movement joystick">
          <span id="mobile-move-knob"></span>
        </div>
        <button id="mobile-interact" class="mobile-action-button" type="button">USE</button>
        <button id="mobile-console" class="mobile-action-button" type="button">CONSOLE</button>
        <button id="mobile-speed" class="mobile-action-button" type="button">1×</button>
      </div>`);
  }

  private bindEvents(): void {
    this.movePad.addEventListener('pointerdown', this.onMovePointerDown);
    this.movePad.addEventListener('pointermove', this.onMovePointerMove);
    this.movePad.addEventListener('pointerup', this.onMovePointerEnd);
    this.movePad.addEventListener('pointercancel', this.onMovePointerEnd);

    this.lookZone.addEventListener('pointerdown', this.onLookPointerDown);
    this.lookZone.addEventListener('pointermove', this.onLookPointerMove);
    this.lookZone.addEventListener('pointerup', this.onLookPointerEnd);
    this.lookZone.addEventListener('pointercancel', this.onLookPointerEnd);

    this.interactButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.callbacks.onInteract();
    });
    this.consoleButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.ui.togglePanel();
    });
    this.speedButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const index = SPEEDS.indexOf(this.speed as 0 | 1 | 4);
      const next = SPEEDS[(index + 1 + SPEEDS.length) % SPEEDS.length] ?? 1;
      this.setSpeed(next);
      this.callbacks.onSpeedChange(next);
    });
    this.modeButton.addEventListener('click', () => this.cycleMode());

    window.addEventListener('resize', this.onEnvironmentChanged);
    window.addEventListener('orientationchange', this.onEnvironmentChanged);
    this.coarsePointer.addEventListener('change', this.onEnvironmentChanged);
    this.noHover.addEventListener('change', this.onEnvironmentChanged);
  }

  private readonly onMovePointerDown = (event: PointerEvent): void => {
    if (!this.active || this.panelOpen) return;
    event.preventDefault();
    this.movePointerId = event.pointerId;
    this.movePad.setPointerCapture(event.pointerId);
    this.updateMoveControl(event.clientX, event.clientY);
  };

  private readonly onMovePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.movePointerId) return;
    event.preventDefault();
    this.updateMoveControl(event.clientX, event.clientY);
  };

  private readonly onMovePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.movePointerId) return;
    event.preventDefault();
    this.resetMoveControl();
  };

  private readonly onLookPointerDown = (event: PointerEvent): void => {
    if (!this.active || this.panelOpen) return;
    event.preventDefault();
    this.lookPointerId = event.pointerId;
    this.lastLookX = event.clientX;
    this.lastLookY = event.clientY;
    this.lookZone.setPointerCapture(event.pointerId);
  };

  private readonly onLookPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - this.lastLookX;
    const deltaY = event.clientY - this.lastLookY;
    this.lastLookX = event.clientX;
    this.lastLookY = event.clientY;
    this.world.addTouchLook(deltaX, deltaY);
  };

  private readonly onLookPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId) return;
    event.preventDefault();
    this.lookPointerId = null;
  };

  private readonly onEnvironmentChanged = (): void => {
    if (this.mode === 'auto') this.applyMode();
    else this.updateOrientationHint();
  };

  private updateMoveControl(clientX: number, clientY: number): void {
    const bounds = this.movePad.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const radius = Math.max(28, Math.min(bounds.width, bounds.height) * 0.34);
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > radius) {
      deltaX = deltaX / distance * radius;
      deltaY = deltaY / distance * radius;
    }
    this.moveKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    this.world.setTouchMovement(deltaX / radius, -deltaY / radius);
  }

  private resetMoveControl(): void {
    this.movePointerId = null;
    this.moveKnob.style.transform = 'translate(0, 0)';
    this.world.setTouchMovement(0, 0);
  }

  private cycleMode(): void {
    const currentIndex = DISPLAY_MODES.indexOf(this.mode);
    this.mode = DISPLAY_MODES[(currentIndex + 1) % DISPLAY_MODES.length] ?? 'auto';
    try {
      localStorage.setItem(STORAGE_KEY, this.mode);
    } catch {
      // The override remains valid for this session when storage is unavailable.
    }
    this.applyMode();
  }

  private applyMode(): void {
    this.active = this.mode === 'mobile' || (this.mode === 'auto' && this.shouldUseMobile());
    document.body.classList.toggle('mobile-mode', this.active);
    document.documentElement.classList.toggle('mobile-mode', this.active);
    this.root.hidden = !this.active;
    this.world.setMobileMode(this.active);
    if (!this.active) this.resetMoveControl();
    this.modeButton.textContent = `DISPLAY: ${this.mode.toUpperCase()}`;
    this.modeButton.dataset.mode = this.mode;
    this.updateStartInstructions();
    this.updateInteractionPrompt();
    this.setPanelOpen(this.ui.isPanelVisible());
  }

  private shouldUseMobile(): boolean {
    const touchCapable = navigator.maxTouchPoints > 0;
    const mobileInput = this.coarsePointer.matches || this.noHover.matches;
    return mobileInput && (touchCapable || window.innerWidth <= 1100);
  }

  private updateStartInstructions(): void {
    const controls = document.querySelector<HTMLElement>('.controls-grid');
    const startButton = document.getElementById('start-button');
    if (!controls || !(startButton instanceof HTMLButtonElement)) return;
    if (this.active) {
      controls.innerHTML = `
        <span><kbd>◉</kbd> Left thumb moves</span>
        <span><kbd>↔</kbd> Right-side drag looks</span>
        <span><kbd>USE</kbd> Interact</span>
        <span><kbd>CONSOLE</kbd> Manage the team</span>`;
      startButton.textContent = 'Tap to enter the office';
    } else {
      controls.innerHTML = `
        <span><kbd>WASD</kbd> Move</span>
        <span><kbd>Mouse</kbd> Look</span>
        <span><kbd>E</kbd> Interact</span>
        <span><kbd>Tab</kbd> Console</span>
        <span><kbd>Esc</kbd> Release cursor</span>`;
      startButton.textContent = 'Enter the office';
    }
  }

  private updateInteractionPrompt(): void {
    const key = document.querySelector<HTMLElement>('#interaction-prompt kbd');
    if (key) key.textContent = this.active ? 'USE' : 'E';
  }

  private updateOrientationHint(): void {
    const portrait = window.innerHeight > window.innerWidth;
    this.orientationHint.hidden = !(this.active && !this.panelOpen && portrait && window.innerWidth < 900);
  }

  private readMode(): DisplayMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return isDisplayMode(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  }

  private requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing mobile control element: ${id}`);
    return element as T;
  }
}
