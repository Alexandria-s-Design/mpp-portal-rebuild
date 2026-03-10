/**
 * MPP Agreement Dashboard Tour
 *
 * Guided tour for the Agreement Overview page using Shepherd.js.
 * Features dark overlay with spotlight cutout, voiceover audio,
 * and responsive modal positioning.
 *
 * Usage:
 * - Press Ctrl+Shift+T or click "Start Tour" to begin
 * - Use Config Mode (Ctrl+Shift+P) to adjust modal positions
 */

(function() {
  'use strict';

  let tour = null;
  let programmaticScroll = false;
  let welcomeModalShown = false;
  let spotlightOverlay = null;

  function createSpotlightOverlay() {
    if (spotlightOverlay) return;
    spotlightOverlay = document.createElement('div');
    spotlightOverlay.id = 'tour-spotlight-overlay';
    spotlightOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.85); z-index: 9998;
      pointer-events: auto;
      transition: clip-path 0.3s ease-in-out, opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(spotlightOverlay);
  }

  function updateSpotlight(element, padding = 10) {
    if (!spotlightOverlay || !element) return;
    const rect = element.getBoundingClientRect();
    const x1 = Math.max(0, rect.left - padding);
    const y1 = Math.max(0, rect.top - padding);
    const x2 = Math.min(window.innerWidth, rect.right + padding);
    const y2 = Math.min(window.innerHeight, rect.bottom + padding);
    spotlightOverlay.style.clipPath = `polygon(
      0% 0%, 0% 100%, ${x1}px 100%, ${x1}px ${y1}px,
      ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px,
      ${x1}px 100%, 100% 100%, 100% 0%
    )`;
  }

  function removeSpotlightOverlay() {
    if (spotlightOverlay) {
      spotlightOverlay.remove();
      spotlightOverlay = null;
    }
  }

  function showFullColorPause(duration = 1000) {
    return new Promise(resolve => {
      if (!spotlightOverlay) { resolve(); return; }
      spotlightOverlay.style.opacity = '0';
      setTimeout(() => {
        if (spotlightOverlay) spotlightOverlay.style.opacity = '1';
        resolve();
      }, duration);
    });
  }

  function transitionToNext() {
    showFullColorPause(800).then(() => { if (tour) tour.next(); });
  }

  function transitionToBack() {
    showFullColorPause(800).then(() => { if (tour) tour.back(); });
  }

  // Tour step definitions
  const tourSteps = [
    {
      id: 'welcome',
      text: '<h3>Agreement Dashboard</h3><p>This is the main Pathway to an Agreement page. The left navigation panel provides access to all portal sections. The main content area displays each step required to complete an MPP agreement.</p>',
      attachTo: { element: '.flex.min-h-screen', on: 'bottom' },
      audio: './audio/step-01-welcome.mp3',
      buttons: [
        { text: 'Skip Tour', action: function() { tour.cancel(); }, secondary: true },
        { text: 'Start Tour', action: function() { transitionToNext(); } }
      ]
    }
    // Additional steps will be added here as we build them together
  ];

  function showWelcomeModal() {
    if (welcomeModalShown) return;
    welcomeModalShown = true;

    Swal.fire({
      title: 'Mentor-Prot\u00e9g\u00e9 Agreement Wizard',
      html: `
        <p>This guided tour will walk you through the <strong>Pathway to an Agreement</strong> \u2014 each step required to complete and submit an MPP agreement.</p>
        <br>
        <h4>\ud83c\udfaf What you\u2019ll learn:</h4>
        <ul style="text-align: left; margin: 10px 20px;">
          <li>How to navigate the Agreement Dashboard</li>
          <li>The six pathway sections for building an agreement</li>
        </ul>
      `,
      confirmButtonText: 'Start',
      showCancelButton: false,
      customClass: { popup: 'modal-redesigned' },
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        startTour();
      }
    });
  }

  function startTour() {
    if (tour) { tour.cancel(); }

    document.body.classList.add('tour-active');
    createSpotlightOverlay();

    tour = new Shepherd.Tour({
      useModalOverlay: false,
      defaultStepOptions: {
        cancelIcon: { enabled: false },
        scrollTo: { behavior: 'smooth', block: 'center' },
        modalOverlayOpeningPadding: 0,
        canClickTarget: false
      }
    });

    tourSteps.forEach(stepDef => {
      const step = {
        id: stepDef.id,
        text: stepDef.text,
        attachTo: stepDef.attachTo,
        buttons: (stepDef.buttons || []).map(btn => ({
          text: btn.text,
          action: btn.action,
          classes: btn.secondary ? 'shepherd-button-secondary' : ''
        })),
        when: {
          show: function() {
            const currentStep = tour.getCurrentStep();
            const el = currentStep && currentStep.getElement();
            const target = currentStep && currentStep.getTarget();

            if (target) {
              updateSpotlight(target, 20);
            }

            // Play audio if available
            if (stepDef.audio && window.TourAudioManager) {
              window.TourAudioManager.play(stepDef.audio);
            }
          },
          hide: function() {
            if (window.TourAudioManager) {
              window.TourAudioManager.stop();
            }
          }
        }
      };
      tour.addStep(step);
    });

    tour.on('cancel', cleanup);
    tour.on('complete', cleanup);
    tour.start();
  }

  function cleanup() {
    document.body.classList.remove('tour-active');
    removeSpotlightOverlay();
    if (window.TourAudioManager) {
      window.TourAudioManager.stop();
    }
  }

  // Keyboard shortcut: Ctrl+Shift+T to start tour
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      showWelcomeModal();
    }
  });

  // Auto-show welcome modal on page load
  window.addEventListener('load', function() {
    setTimeout(showWelcomeModal, 1000);
  });

})();
