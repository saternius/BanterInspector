this.onStart = async () => {
    log("scratchy", "onStart")
    const volume = 1;
    const pitch = 1;
    const mute = false;
    const loop = false;
    const bypassEffects = false;
    const bypassListenerEffects = false;
    const bypassReverbZones = false;
    const playOnAwake = false;

    const gameObject = new BS.GameObject("MyAudioSource"); 
    const audioSource = await gameObject.AddComponent(new BS.BanterAudioSource(volume, pitch, mute, loop, bypassEffects, bypassListenerEffects, bypassReverbZones, playOnAwake));
    // ...
    audioSource.Play();
    // ...
    audioSource.PlayOneShot(0);
    // ...
    audioSource.PlayOneShotFromUrl("https://suitable-bulldog-flying.ngrok-free.app/assets/audio/tick.mp3");

}