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

  // Saved positions from Config Mode (captured at 1676x1022)
  const savedPositions = {
    "agreement-dashboard": {
      "scrollY": 0,
      "highlight": { "top": "-0.51%", "left": "0.01%", "width": "1670.99px", "height": "368.99px" },
      "modal": { "top": "14.20%", "left": "62.05%" }
    }
  };

  // Tour step definitions
  const tourSteps = [
    {
      id: 'agreement-dashboard',
      text: '<h3>Agreement Dashboard</h3><p>This is the main Pathway to an Agreement page.</p>',
      attachTo: { element: 'body', on: 'right' },
      scrollTo: false,
      audio: './audio/step-01-welcome.mp3',
      buttons: [
        { text: 'Next', action: function() { transitionToNext(); } }
      ]
    }
    // Additional steps will be added here as we build them together
  ];

  function showWelcomeModal() {
    if (welcomeModalShown) return;
    welcomeModalShown = true;

    var modalEl = document.createElement('div');
    modalEl.id = 'welcome-overlay';
    modalEl.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
    modalEl.innerHTML = '<div style="background:white;border:3px solid #1a3a6e;border-radius:12px;padding:40px;max-width:600px;width:90vw;text-align:center;font-family:Roboto,sans-serif;animation:borderPulse 3s ease-in-out infinite,modalFadeIn 0.3s ease;">' +
      '<h2 style="font-size:30px;font-weight:700;color:#1a3a6e;margin:0 0 20px 0;">Mentor-Prot\u00e9g\u00e9 Agreement Wizard</h2>' +
      '<p style="font-size:20px;line-height:1.6;color:#333;">This guided tour will walk you through the <strong>Pathway to an Agreement</strong> \u2014 each step required to complete and submit an MPP agreement.</p>' +
      '<br>' +
      '<h4 style="font-size:20px;font-weight:600;color:#1a3a6e;">\ud83c\udfaf What you\u2019ll learn:</h4>' +
      '<ul style="text-align:left;margin:10px 20px;font-size:18px;line-height:1.8;color:#333;">' +
      '<li>How to navigate the Agreement Dashboard</li>' +
      '<li>The six pathway sections for building an agreement</li>' +
      '</ul>' +
      '<button id="welcome-start-btn" style="background-color:#1a3a6e;color:white;font-weight:600;padding:12px 32px;border-radius:6px;border:none;cursor:pointer;font-size:16px;margin-top:20px;">Start</button>' +
      '</div>';
    document.body.appendChild(modalEl);

    document.getElementById('welcome-start-btn').addEventListener('click', function() {
      document.getElementById('welcome-overlay').remove();
      startTour();
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
        scrollTo: false,
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
            const pos = savedPositions[stepDef.id];

            if (pos) {
              // Apply saved modal position
              if (pos.modal && el) {
                el.style.position = 'fixed';
                el.style.top = pos.modal.top;
                el.style.left = pos.modal.left;
                el.style.transform = 'none';
              }
              // Apply saved highlight
              if (pos.highlight && spotlightOverlay) {
                var vw = window.innerWidth;
                var vh = window.innerHeight;
                var x1 = parseFloat(pos.highlight.left) / 100 * vw;
                var y1 = parseFloat(pos.highlight.top) / 100 * vh;
                var w = parseFloat(pos.highlight.width);
                var h = parseFloat(pos.highlight.height);
                // Scale from captured viewport
                var scaleX = vw / 1676;
                var scaleY = vh / 1022;
                w = w * scaleX;
                h = h * scaleY;
                var x2 = x1 + w;
                var y2 = y1 + h;
                spotlightOverlay.style.clipPath = 'polygon(0% 0%, 0% 100%, ' + x1 + 'px 100%, ' + x1 + 'px ' + y1 + 'px, ' + x2 + 'px ' + y1 + 'px, ' + x2 + 'px ' + y2 + 'px, ' + x1 + 'px ' + y2 + 'px, ' + x1 + 'px 100%, 100% 100%, 100% 0%)';
              }
              // Scroll to saved position
              window.scrollTo(0, pos.scrollY || 0);
            } else if (target) {
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
