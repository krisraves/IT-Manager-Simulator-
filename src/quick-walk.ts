import './quick-walk.css';

const installQuickWalkButton = (): void => {
  if (document.getElementById('quick-walk-button')) return;

  const pauseButton = document.getElementById('quick-pause-button');
  if (!pauseButton) {
    window.requestAnimationFrame(installQuickWalkButton);
    return;
  }

  const button = document.createElement('button');
  button.id = 'quick-walk-button';
  button.type = 'button';
  button.title = 'Close the console and walk around the office';
  button.setAttribute('aria-label', 'Walk Around');
  button.innerHTML = '<span aria-hidden="true">⌖</span><strong>Walk Around</strong>';

  button.addEventListener('click', () => {
    const panelToggle = document.getElementById('panel-toggle');
    const panelIsOpen = panelToggle?.getAttribute('aria-expanded') === 'true';
    if (panelIsOpen) panelToggle?.click();

    const canvas = document.getElementById('game-canvas');
    const mobileMode = document.body.classList.contains('mobile-mode');
    if (!mobileMode && canvas instanceof HTMLCanvasElement && document.pointerLockElement !== canvas) {
      void canvas.requestPointerLock().catch(() => {
        // Browsers can reject pointer lock while another modal owns focus.
      });
    }
  });

  pauseButton.insertAdjacentElement('beforebegin', button);
};

installQuickWalkButton();
