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

const entityData = {
    name: "MyCustomObject",
    active: true,
    layer: 0,  // Default layer
    persistent: true,
  
    // Transform at entity level (NOT as component)
    transform: {
      localPosition: { x: 0, y: 1, z: 0 },
      localRotation: { x: 0, y: 0, z: 0, w: 1 },
      localScale: { x: 1, y: 1, z: 1 }
    },
  
    // Components array
    components: [
      // Add components here (see patterns below)
    ]
  };
  
  
  entityData.components = [
    {
      type: "GLTF",
      properties: {
        url: "https://your-cdn.com/model.glb",
        addColliders: true,
        nonConvexColliders: false,
        legacyRotate: false
      }
    },
    {
      type: "MonoBehavior",
      properties: {
        file: "Grabbable.js"
      }
    }
  ];
  
  
  const inventoryItem = {
    author: SM.scene?.localUser?.name || 'Agent',
    name: "MyCustomObject",
    created: Date.now(),
    last_used: Date.now(),
    itemType: "entity",
    icon: "📦",
    description: "Custom object created by agent",
    data: entityData,
    folder: null  // or specify folder name
  };
  
  (async () => {
      const item = ${JSON.stringify(inventoryItem)};
      const storageKey = 'inventory_' + item.name;
      localStorage.setItem(storageKey, JSON.stringify(item));
  
      // Update inventory cache
      if (window.inventory) {
        window.inventory.items[item.name] = item;
        window.inventory.reload();
      }
      return { success: true, itemName: item.name };
  })()