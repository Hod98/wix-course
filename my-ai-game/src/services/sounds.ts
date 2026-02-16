/**
 * Sound Effects Service using Web Audio API
 * All sounds are generated programmatically - no external files needed!
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize the Audio Context (call this on first user interaction)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Create a gain node (volume control)
 */
function createGain(context: AudioContext, value: number): GainNode {
  const gainNode = context.createGain();
  gainNode.gain.value = value;
  return gainNode;
}

/**
 * Play a soft "whoosh" sound when player sends a message
 * Creates a filtered noise burst that sweeps downward
 */
export function playWhooshSound(): void {
  try {
    const context = getAudioContext();
    const now = context.currentTime;
    
    // Create noise using a buffer
    const bufferSize = context.sampleRate * 0.3; // 300ms
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate pink noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    // Filter for wind-like sound
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    filter.Q.value = 1;
    
    // Volume envelope
    const gainNode = createGain(context, 0);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Connect: noise → filter → gain → output
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    
    noise.start(now);
    noise.stop(now + 0.3);
    
  } catch (error) {
    console.warn('Could not play whoosh sound:', error);
  }
}

/**
 * Play a gentle typing sound (like soft key presses)
 * This creates a short click with a bit of noise
 */
export function playTypingSound(): void {
  try {
    const context = getAudioContext();
    const now = context.currentTime;
    
    // Create a short burst of filtered noise for click
    const bufferSize = context.sampleRate * 0.02; // 20ms
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise with quick decay
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * 0.2 * decay;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    // High-pass filter for crisp sound
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    // Subtle volume
    const gainNode = createGain(context, 0.08);
    
    // Connect
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    
    noise.start(now);
    noise.stop(now + 0.02);
    
  } catch (error) {
    console.warn('Could not play typing sound:', error);
  }
}

/**
 * Play a magical chime when starting a new game
 * Creates harmonious tones that shimmer upward
 */
export function playMagicalChime(): void {
  try {
    const context = getAudioContext();
    const now = context.currentTime;
    
    // Magic frequencies (pentatonic scale for pleasant harmony)
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const delay = index * 0.08; // Stagger each note
      
      // Main oscillator (sine wave for pure tone)
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      // Add subtle vibrato
      const vibrato = context.createOscillator();
      vibrato.frequency.value = 5; // 5Hz vibrato
      const vibratoGain = createGain(context, 8);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      // Volume envelope (fade in and out)
      const gainNode = createGain(context, 0);
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.12, now + delay + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.2);
      
      // Add reverb-like effect with delay
      const delayNode = context.createDelay();
      delayNode.delayTime.value = 0.03;
      const delayGain = createGain(context, 0.3);
      
      // Connect
      osc.connect(gainNode);
      gainNode.connect(context.destination);
      gainNode.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(context.destination);
      
      // Play
      osc.start(now + delay);
      vibrato.start(now + delay);
      osc.stop(now + delay + 1.5);
      vibrato.stop(now + delay + 1.5);
    });
    
  } catch (error) {
    console.warn('Could not play magical chime:', error);
  }
}

/**
 * Play typing sound repeatedly for streaming effect
 * Returns a stop function to end the typing loop
 */
export function startTypingLoop(): () => void {
  let isPlaying = true;
  let timeoutId: number | null = null;
  
  const playLoop = () => {
    if (!isPlaying) return;
    
    playTypingSound();
    
    // Random interval between 50-150ms for natural typing rhythm
    const interval = 50 + Math.random() * 100;
    timeoutId = window.setTimeout(playLoop, interval);
  };
  
  playLoop();
  
  // Return stop function
  return () => {
    isPlaying = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Initialize audio context on first user interaction
 * Call this from a button click or user gesture
 */
export function initializeAudio(): void {
  try {
    getAudioContext();
  } catch (error) {
    console.warn('Could not initialize audio:', error);
  }
}

