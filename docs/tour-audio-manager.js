/**
 * Tour Audio Manager
 *
 * Handles voiceover narration and sound effects for the MPP Dashboard Tour.
 * Features:
 * - External MP3 files (portable, zippable)
 * - Autoplay when step appears
 * - Pause/play controls
 * - Volume management
 * - Preloading next step's audio
 *
 * @version 1.0.0
 */
(function() {
  'use strict';

  const TourAudioManager = {
    // Current playback state
    currentVoiceover: null,
    currentStepId: null,
    isPlaying: false,
    audioEnabled: true,
    volume: 1.0,

    // UI element references (set by injectControlUI)
    ui: {
      progressFill: null,
      timeDisplay: null,
      playBtn: null,
      muteBtn: null
    },

    // Preloaded audio cache
    audioCache: {},

    // Base path for audio files
    audioBasePath: './audio/',

    // Sound effects
    sfxEnter: null,
    sfxExit: null,
    sfxLoaded: false,

    // Progress tracking
    progressBar: null,
    progressInterval: null,

    // Voiceover file mapping (stepId -> filename)
    voiceoverMap: {
      'welcome': 'voiceover/01-welcome.mp3',
      'mpp-message': 'voiceover/02-mpp-message.mp3',
      'card-agreements': 'voiceover/03-card-agreements.mp3',
      'card-applications': 'voiceover/04-card-applications.mp3',
      'card-resources': 'voiceover/05-card-resources.mp3',
      'card-team': 'voiceover/06-card-team.mp3',
      'card-mentor': 'voiceover/07-card-mentor.mp3',
      'card-protege': 'voiceover/08-card-protege.mp3',
      'nav-dashboard': 'voiceover/09-nav-dashboard.mp3',
      'nav-applications': 'voiceover/10-nav-applications.mp3',
      'nav-about-mpp': 'voiceover/11-nav-about-mpp.mp3',
      'nav-mentors': 'voiceover/12-nav-mentors.mp3',
      'nav-proteges': 'voiceover/13-nav-proteges.mp3',
      'nav-agreements': 'voiceover/14-nav-agreements.mp3',
      'nav-resources': 'voiceover/15-nav-resources.mp3',
      'nav-approved-mentors': 'voiceover/16-nav-approved-mentors.mp3',
      'nav-interested-proteges': 'voiceover/17-nav-interested-proteges.mp3',
      'nav-subcontractors': 'voiceover/18-nav-subcontractors.mp3',
      'nav-team': 'voiceover/19-nav-team.mp3',
      'account-feedback': 'voiceover/20-account-feedback.mp3',
      'account-help': 'voiceover/21-account-help.mp3'
    },

    // Step order for preloading next step
    stepOrder: [
      'welcome', 'mpp-message', 'card-agreements', 'card-applications',
      'card-resources', 'card-team', 'card-mentor', 'card-protege',
      'nav-dashboard', 'nav-applications', 'nav-about-mpp', 'nav-mentors',
      'nav-proteges', 'nav-agreements', 'nav-resources', 'nav-approved-mentors',
      'nav-interested-proteges', 'nav-subcontractors', 'nav-team',
      'account-feedback', 'account-help'
    ],

    /**
     * Initialize the audio manager
     */
    async init() {
      console.log('[TourAudioManager] Initializing...');

      // Preload sound effects
      try {
        this.sfxEnter = new Audio(this.audioBasePath + 'sfx/step-enter.mp3');
        this.sfxExit = new Audio(this.audioBasePath + 'sfx/step-exit.mp3');

        // Set volume for SFX (quieter than voiceover)
        this.sfxEnter.volume = 0.3;
        this.sfxExit.volume = 0.2;

        // Preload SFX
        this.sfxEnter.load();
        this.sfxExit.load();
        this.sfxLoaded = true;

        console.log('[TourAudioManager] SFX preloaded');
      } catch (e) {
        console.warn('[TourAudioManager] Failed to preload SFX:', e);
      }

      console.log('[TourAudioManager] Initialized');
    },

    /**
     * Load audio file (with caching)
     * @param {string} stepId - The step ID
     * @returns {Promise<HTMLAudioElement>}
     */
    async loadAudio(stepId) {
      // Return cached audio if available, but reset it first
      if (this.audioCache[stepId]) {
        const cached = this.audioCache[stepId];
        cached.currentTime = 0; // Reset to beginning
        cached.volume = this.volume;
        return cached;
      }

      const filename = this.voiceoverMap[stepId];
      if (!filename) {
        console.warn(`[TourAudioManager] No voiceover for step: ${stepId}`);
        return null;
      }

      return new Promise((resolve, reject) => {
        const audio = new Audio(this.audioBasePath + filename);
        audio.volume = this.volume;

        audio.addEventListener('canplaythrough', () => {
          this.audioCache[stepId] = audio;
          console.log(`[TourAudioManager] Loaded: ${stepId}`);
          resolve(audio);
        }, { once: true });

        audio.addEventListener('error', (e) => {
          console.warn(`[TourAudioManager] Failed to load ${stepId}:`, e);
          resolve(null); // Resolve with null instead of reject to gracefully handle missing files
        }, { once: true });

        audio.load();
      });
    },

    /**
     * Preload the next step's audio
     * @param {string} currentStepId - Current step ID
     */
    preloadNext(currentStepId) {
      const currentIndex = this.stepOrder.indexOf(currentStepId);
      if (currentIndex >= 0 && currentIndex < this.stepOrder.length - 1) {
        const nextStepId = this.stepOrder[currentIndex + 1];
        this.loadAudio(nextStepId).catch(() => {}); // Preload silently
      }
    },

    /**
     * Play SFX for step enter
     */
    async playSfxEnter() {
      if (!this.audioEnabled || !this.sfxEnter) return;

      try {
        this.sfxEnter.currentTime = 0;
        await this.sfxEnter.play();
      } catch (e) {
        // Autoplay might be blocked, that's OK
      }
    },

    /**
     * Play SFX for step exit
     */
    async playSfxExit() {
      if (!this.audioEnabled || !this.sfxExit) return;

      try {
        this.sfxExit.currentTime = 0;
        await this.sfxExit.play();
      } catch (e) {
        // Autoplay might be blocked, that's OK
      }
    },

    /**
     * Play audio for a specific step
     * @param {string} stepId - The step ID
     */
    async playStepAudio(stepId) {
      console.log(`[TourAudioManager] Playing audio for step: ${stepId}`);

      // Stop any currently playing audio
      this.stop();

      // Play enter SFX
      await this.playSfxEnter();

      // Short delay before voiceover starts
      await new Promise(r => setTimeout(r, 200));

      if (!this.audioEnabled) {
        console.log('[TourAudioManager] Audio disabled, skipping voiceover');
        return;
      }

      // Load and play voiceover
      const audio = await this.loadAudio(stepId);
      if (!audio) {
        console.log(`[TourAudioManager] No audio available for step: ${stepId}`);
        return;
      }

      this.currentVoiceover = audio;
      this.currentStepId = stepId;
      audio.currentTime = 0;
      audio.volume = this.volume;

      try {
        await audio.play();
        this.isPlaying = true;

        // Preload next step's audio
        this.preloadNext(stepId);

        // Handle audio ending
        audio.onended = () => {
          this.isPlaying = false;
          this.updateControlUI();
          this.stopProgressTracking();
        };

        // Track time updates for responsive UI
        audio.ontimeupdate = () => {
          this.updateProgressUI();
        };

        // Update UI when metadata loads (for duration display)
        audio.onloadedmetadata = () => {
          this.updateProgressUI();
          this.updateControlUI();
        };

        // For cached audio, metadata is already loaded - update UI after short delay
        // to ensure DOM elements are injected
        setTimeout(() => {
          this.updateProgressUI();
          this.updateControlUI();
        }, 200);
      } catch (e) {
        console.warn('[TourAudioManager] Playback failed:', e);
        this.isPlaying = false;
        this.updateControlUI();
      }
    },

    /**
     * Stop current audio playback
     */
    stop() {
      // Play exit SFX before stopping
      // (Don't await to avoid blocking)
      this.playSfxExit();

      if (this.currentVoiceover) {
        this.currentVoiceover.pause();
        this.currentVoiceover.currentTime = 0;
        this.currentVoiceover.onended = null;
        this.currentVoiceover.ontimeupdate = null;
        this.currentVoiceover.onloadedmetadata = null;
      }
      this.isPlaying = false;
      this.stopProgressTracking();
      this.updateControlUI();
    },

    /**
     * Pause current audio
     */
    pause() {
      if (this.currentVoiceover && this.isPlaying) {
        this.currentVoiceover.pause();
        this.isPlaying = false;
        this.updateControlUI();
      }
    },

    /**
     * Resume paused audio
     */
    resume() {
      if (this.currentVoiceover && !this.isPlaying && this.audioEnabled) {
        this.currentVoiceover.play().then(() => {
          this.isPlaying = true;
          this.updateControlUI();
        }).catch(e => {
          console.warn('[TourAudioManager] Resume failed:', e);
        });
      }
    },

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
    },

    /**
     * Toggle mute/unmute
     */
    toggleMute() {
      this.audioEnabled = !this.audioEnabled;

      if (!this.audioEnabled && this.currentVoiceover) {
        this.pause();
      }

      this.updateControlUI();
      console.log(`[TourAudioManager] Audio ${this.audioEnabled ? 'enabled' : 'disabled'}`);
    },

    /**
     * Set volume level
     * @param {number} level - Volume level (0-1)
     */
    setVolume(level) {
      this.volume = Math.max(0, Math.min(1, level));

      if (this.currentVoiceover) {
        this.currentVoiceover.volume = this.volume;
      }

      console.log(`[TourAudioManager] Volume set to ${Math.round(this.volume * 100)}%`);
    },

    /**
     * Seek to position in current audio
     * @param {number} percent - Position as percentage (0-100)
     */
    seekTo(percent) {
      if (this.currentVoiceover && this.currentVoiceover.duration) {
        const time = (percent / 100) * this.currentVoiceover.duration;
        this.currentVoiceover.currentTime = time;
      }
    },

    /**
     * Start tracking progress for UI updates
     */
    startProgressTracking() {
      this.stopProgressTracking();

      this.progressInterval = setInterval(() => {
        this.updateProgressUI();
      }, 100);
    },

    /**
     * Stop progress tracking
     */
    stopProgressTracking() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    },

    /**
     * Update progress bar UI
     * Uses stored references from injectControlUI
     */
    updateProgressUI() {
      if (!this.currentVoiceover) return;

      const progressBar = this.ui.progressFill;
      const timeDisplay = this.ui.timeDisplay;

      if (progressBar && this.currentVoiceover.duration) {
        const percent = (this.currentVoiceover.currentTime / this.currentVoiceover.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }

      if (timeDisplay) {
        const duration = this.currentVoiceover.duration || 0;
        const current = this.formatTime(this.currentVoiceover.currentTime);
        const total = this.formatTime(duration);
        timeDisplay.textContent = `${current}/${total}`;
      }
    },

    /**
     * Update control button UI
     * Uses stored references from injectControlUI
     */
    updateControlUI() {
      const muteBtn = this.ui.muteBtn;
      const playBtn = this.ui.playBtn;

      if (muteBtn) {
        muteBtn.textContent = this.audioEnabled ? '\u{1F50A}' : '\u{1F507}';
        muteBtn.title = this.audioEnabled ? 'Mute' : 'Unmute';
      }

      if (playBtn) {
        playBtn.innerHTML = this.isPlaying ? '&#10074;&#10074;' : '&#9654;';
        playBtn.title = this.isPlaying ? 'Pause' : 'Play';
        playBtn.style.paddingLeft = this.isPlaying ? '0' : '2px'; // Center play icon
      }
    },

    /**
     * Format seconds as MM:SS
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Create and inject audio control UI into a modal
     * @param {Element} modal - The Shepherd modal element
     */
    injectControlUI(modal) {
      // Check if already injected
      if (modal.querySelector('.tour-audio-controls')) return;

      // Try to find the text content area first, then fall back to footer
      const textArea = modal.querySelector('.shepherd-text');
      const footer = modal.querySelector('.shepherd-footer');
      const insertTarget = textArea || footer;
      if (!insertTarget) return;

      const controlsHTML = `
        <div class="tour-audio-controls" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #dee2e6;
          border-radius: 8px;
          margin-top: 16px;
          margin-bottom: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          min-width: 280px;
        ">
          <button class="tour-audio-mute" style="
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          " title="Mute">\u{1F50A}</button>

          <button class="tour-audio-play" style="
            background: #1a3a6e;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          " title="Play/Pause">\u25B6</button>

          <div class="tour-audio-progress" style="
            flex: 1;
            height: 8px;
            background: #ddd;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            min-width: 80px;
          ">
            <div class="tour-audio-progress-fill" style="
              height: 100%;
              background: linear-gradient(90deg, #1a3a6e 0%, #2a5298 100%);
              border-radius: 4px;
              width: 0%;
              transition: width 0.1s linear;
            "></div>
          </div>

          <span class="tour-audio-time" style="
            font-size: 12px;
            font-weight: 500;
            color: #495057;
            min-width: 70px;
            text-align: center;
            background: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            flex-shrink: 0;
          ">0:00/0:00</span>
        </div>
      `;

      // Insert at the end of text area, or before footer
      if (textArea) {
        textArea.insertAdjacentHTML('beforeend', controlsHTML);
      } else {
        footer.insertAdjacentHTML('beforebegin', controlsHTML);
      }

      // Add event listeners programmatically (more reliable than inline onclick)
      const controls = modal.querySelector('.tour-audio-controls');
      if (controls) {
        const muteBtn = controls.querySelector('.tour-audio-mute');
        const playBtn = controls.querySelector('.tour-audio-play');
        const progressBar = controls.querySelector('.tour-audio-progress');
        const progressFill = controls.querySelector('.tour-audio-progress-fill');
        const timeDisplay = controls.querySelector('.tour-audio-time');

        // Store references for updates
        this.ui.muteBtn = muteBtn;
        this.ui.playBtn = playBtn;
        this.ui.progressFill = progressFill;
        this.ui.timeDisplay = timeDisplay;

        if (muteBtn) {
          muteBtn.addEventListener('click', () => {
            window.TourAudioManager.toggleMute();
          });
        }

        if (playBtn) {
          playBtn.addEventListener('click', () => {
            window.TourAudioManager.togglePlayPause();
          });
        }

        if (progressBar) {
          progressBar.addEventListener('click', (event) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = ((event.clientX - rect.left) / rect.width) * 100;
            window.TourAudioManager.seekTo(percent);
          });
        }
      }

      // Update UI to reflect current state
      this.updateControlUI();
      this.updateProgressUI();

      // Start progress tracking now that DOM elements exist
      this.startProgressTracking();
    },

    /**
     * Handle click on progress bar
     * @param {Event} event
     */
    handleProgressClick(event) {
      const progressBar = event.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      this.seekTo(percent);
    },

    /**
     * Clean up when tour ends
     */
    cleanup() {
      this.stop();
      this.currentStepId = null;
      this.stopProgressTracking();
      console.log('[TourAudioManager] Cleaned up');
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TourAudioManager.init());
  } else {
    TourAudioManager.init();
  }

  // Expose globally
  window.TourAudioManager = TourAudioManager;

  console.log('[TourAudioManager] Module loaded');
})();
