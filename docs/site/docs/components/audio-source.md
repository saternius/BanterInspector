---
sidebar_position: 6
title: Audio Source Component
---

# Audio Source Component

The Audio Source component plays sounds and music in your VR scene, with support for 3D spatial audio, looping, and volume control.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎵 Audio Features</h3>
  <ul>
    <li>3D spatial sound positioning</li>
    <li>Background music and sound effects</li>
    <li>Volume and pitch control</li>
    <li>Looping and one-shot playback</li>
    <li>Distance-based attenuation</li>
  </ul>
</div>

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `clip` | string | null | Audio file URL or asset path |
| `volume` | number | 1 | Volume level (0-1) |
| `pitch` | number | 1 | Playback speed/pitch |
| `loop` | boolean | false | Repeat when finished |
| `playOnAwake` | boolean | true | Auto-play on start |
| `spatial` | boolean | true | 3D spatial audio |
| `minDistance` | number | 1 | Full volume distance |
| `maxDistance` | number | 500 | Silence distance |

## Basic Usage

### Adding Audio
```javascript
// Via Inspector
1. Select GameObject
2. Add Component → Audio → Audio Source
3. Set audio clip URL or drag from assets
4. Configure volume and spatial settings

// Via Script
const audioSource = entity.addComponent("BanterAudioSource", {
    clip: "sounds/background-music.mp3",
    volume: 0.5,
    loop: true,
    playOnAwake: true
});
```

### Playing Sounds
```javascript
// Play
audioSource.Play();

// Play specific clip
audioSource.PlayOneShot("sounds/explosion.wav", 0.8); // Volume multiplier

// Stop
audioSource.Stop();

// Pause/Resume
audioSource.Pause();
audioSource.UnPause();
```

## 3D Spatial Audio

### Positioning
```javascript
// Audio follows GameObject position
{
    spatial: true,
    minDistance: 1,   // Full volume within 1 meter
    maxDistance: 20   // Silent beyond 20 meters
}
```

### Falloff Curves
```javascript
// Linear falloff
audioSource.Set("rolloffMode", "Linear");

// Logarithmic (more realistic)
audioSource.Set("rolloffMode", "Logarithmic");

// Custom curve
audioSource.Set("rolloffMode", "Custom");
audioSource.Set("customCurve", animationCurve);
```

## Common Audio Patterns

### Background Music
```javascript
class MusicManager {
    constructor() {
        this.musicSource = null;
        this.tracks = [
            "music/track1.mp3",
            "music/track2.mp3",
            "music/track3.mp3"
        ];
        this.currentTrack = 0;
    }
    
    start() {
        const entity = scene.createEntity({name: "MusicPlayer"});
        this.musicSource = entity.addComponent("BanterAudioSource", {
            volume: 0.3,
            loop: false,
            spatial: false, // 2D sound for music
            playOnAwake: false
        });
        
        this.playNext();
    }
    
    playNext() {
        this.musicSource.Set("clip", this.tracks[this.currentTrack]);
        this.musicSource.Play();
        
        // Queue next track
        this.musicSource.On("finished", () => {
            this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
            this.playNext();
        });
    }
    
    fadeOut(duration = 1000) {
        const startVolume = this.musicSource.Get("volume");
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            
            this.musicSource.Set("volume", startVolume * (1 - t));
            
            if (t < 1) {
                requestAnimationFrame(fade);
            } else {
                this.musicSource.Stop();
            }
        };
        
        fade();
    }
}
```

### Sound Effects Pool
```javascript
class SoundEffectPool {
    constructor(clipPath, poolSize = 5) {
        this.sources = [];
        
        // Create pool of audio sources
        for (let i = 0; i < poolSize; i++) {
            const entity = scene.createEntity({name: `SFX_${i}`});
            const source = entity.addComponent("BanterAudioSource", {
                clip: clipPath,
                loop: false,
                playOnAwake: false,
                spatial: true
            });
            this.sources.push(source);
        }
    }
    
    playAt(position, volume = 1) {
        // Find available source
        const source = this.sources.find(s => !s.isPlaying());
        
        if (source) {
            source.entity.getTransform().Set("position", position);
            source.Set("volume", volume);
            source.Play();
        }
    }
}
```

### Dynamic Audio
```javascript
// Pitch modulation based on speed
this.updateEngineSound = () => {
    const speed = this.rigidbody.Get("velocity").magnitude;
    const normalizedSpeed = speed / this.maxSpeed;
    
    // Pitch increases with speed
    this.engineSound.Set("pitch", 0.8 + normalizedSpeed * 0.6);
    
    // Volume increases with speed
    this.engineSound.Set("volume", 0.3 + normalizedSpeed * 0.5);
}

// Doppler effect simulation
this.simulateDoppler = (listener, source) => {
    const relativeVelocity = this.getRelativeVelocity(listener, source);
    const dopplerFactor = 1 + (relativeVelocity / 343); // Speed of sound
    
    source.Set("pitch", source.basePitch * dopplerFactor);
}
```

## Interactive Audio

### Click Sounds
```javascript
this._entity._bs.On("click", () => {
    this.audioSource.PlayOneShot("sounds/click.wav", 0.5);
});

this._entity._bs.On("hover-enter", () => {
    this.audioSource.PlayOneShot("sounds/hover.wav", 0.3);
});
```

### Collision Sounds
```javascript
this._entity._bs.On("collision-enter", (collision) => {
    const impact = collision.relativeVelocity.magnitude;
    
    if (impact > 5) {
        // Loud crash
        this.audioSource.PlayOneShot("sounds/crash.wav", 1);
    } else if (impact > 2) {
        // Medium hit
        this.audioSource.PlayOneShot("sounds/hit.wav", 0.5);
    } else {
        // Soft tap
        this.audioSource.PlayOneShot("sounds/tap.wav", 0.2);
    }
});
```

### Footsteps
```javascript
class FootstepController {
    constructor(character) {
        this.character = character;
        this.audioSource = character.getComponent("BanterAudioSource");
        this.footstepSounds = [
            "sounds/step1.wav",
            "sounds/step2.wav",
            "sounds/step3.wav",
            "sounds/step4.wav"
        ];
        this.stepInterval = 0.5; // Seconds between steps
        this.lastStepTime = 0;
        this.isMoving = false;
    }
    
    update() {
        const velocity = this.character.rigidbody.Get("velocity");
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        this.isMoving = speed > 0.1;
        
        if (this.isMoving) {
            const now = Date.now() / 1000;
            
            // Adjust step rate based on speed
            const stepRate = this.stepInterval / (speed / 2);
            
            if (now - this.lastStepTime > stepRate) {
                this.playFootstep();
                this.lastStepTime = now;
            }
        }
    }
    
    playFootstep() {
        const randomStep = this.footstepSounds[
            Math.floor(Math.random() * this.footstepSounds.length)
        ];
        
        this.audioSource.PlayOneShot(randomStep, 0.4);
    }
}
```

## Audio Zones

### Ambient Zones
```javascript
class AmbientZone {
    constructor(position, radius, soundPath) {
        this.position = position;
        this.radius = radius;
        
        // Create ambient source
        const entity = scene.createEntity({
            name: "AmbientZone",
            position: position
        });
        
        this.audioSource = entity.addComponent("BanterAudioSource", {
            clip: soundPath,
            loop: true,
            volume: 0,
            spatial: true,
            minDistance: radius * 0.5,
            maxDistance: radius * 2
        });
        
        this.audioSource.Play();
    }
    
    updateListener(listenerPos) {
        const distance = this.getDistance(listenerPos, this.position);
        
        if (distance < this.radius) {
            // Fade in
            const volume = 1 - (distance / this.radius);
            this.audioSource.Set("volume", volume * 0.5);
        } else {
            // Fade out
            this.audioSource.Set("volume", 0);
        }
    }
}
```

## Performance Optimization

### Audio Pooling
```javascript
// Reuse audio sources
const audioPool = new ObjectPool(
    () => createAudioSource(),
    (source) => source.Stop(),
    10 // Pool size
);
```

### LOD Audio
```javascript
// Reduce audio quality at distance
this.updateAudioLOD = (distance) => {
    if (distance > 50) {
        // Far - no audio
        this.audioSource.Set("volume", 0);
    } else if (distance > 20) {
        // Medium - reduced quality
        this.audioSource.Set("volume", 0.5);
        this.audioSource.Set("maxDistance", 30);
    } else {
        // Close - full quality
        this.audioSource.Set("volume", 1);
        this.audioSource.Set("maxDistance", 50);
    }
}
```

## Troubleshooting

### No Sound
- Check volume is not 0
- Verify audio clip path is correct
- Ensure GameObject is active
- Check browser audio permissions

### Distorted Audio
- Lower volume below 1
- Check pitch is reasonable (0.5-2)
- Verify audio file format is supported

### Performance Issues
- Limit simultaneous sounds (~20)
- Use audio pooling
- Reduce spatial audio calculations
- Compress audio files

## Related Components

- [Transform](./transform) - Position for 3D audio
- [Rigidbody](./rigidbody) - Velocity for doppler
- [Collider](./collider) - Trigger zones
- [MonoBehavior](./monobehavior) - Audio control scripts