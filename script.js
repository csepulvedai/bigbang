/* main.js */
/**
 * Big Bang Simulation - Three.js Demo
 *
 * Description:
 * This demo simulates the Big Bang, starting from a dense singularity that expands
 * into a vibrant universe. It features advanced particle systems, a glowing effect
 * via a custom-generated texture, dynamic shadows, and interactive camera controls.
 *
 * Instructions:
 *  - Open index.html in a modern web browser.
 *  - Use the dat.GUI controls (top-right) to adjust simulation parameters such as
 *    expansion speed and particle counts.
 *  - Use the mouse to orbit, pan, and zoom the camera.
 *
 * Code Structure:
 *   1. Scene Setup: Initialize renderer, scene, camera, lighting, and controls.
 *   2. Particle Systems: Create two particle systems – one for the explosion and one
 *      for galaxy clusters.
 *   3. Animation Loop: Update simulation parameters and particle positions each frame.
 *   4. UI Controls: Allow interactive tweaking of simulation parameters.
 */

// Global variables and parameters
let scene, camera, renderer, controls, gui;
let explosionParticles, galaxyParticles;
let explosionGeometry, explosionMaterial;
let galaxyGeometry, galaxyMaterial;
let explosionVelocities = []; // Array to store each explosion particle's velocity
let explosionParams = {
  particleCount: 10000,    // Number of particles in the initial explosion
  expansionSpeed: 1.0,     // Speed multiplier for the expansion
  explosionTime: 0.0       // Simulation time counter for the explosion
};

let galaxyParams = {
  particleCount: 5000,     // Number of particles representing galaxies/nebulae
  galaxySpread: 500,       // How far the galaxies are spread from the center
  created: false           // Flag to ensure galaxy particles are created only once
};

const clock = new THREE.Clock(); // Clock to track time

// Initialize the scene and start the animation loop
init();
animate();

/**
 * Initializes the scene, camera, renderer, lighting, and particle systems.
 */
function init() {
  // Create the main scene with a black background.
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Create a perspective camera.
  camera = new THREE.PerspectiveCamera(
    60, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    2000 // Far clipping plane
  );
  camera.position.set(0, 0, 150);

  // Create the WebGL renderer with antialiasing.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Enable shadow mapping for enhanced realism.
  renderer.shadowMap.enabled = true;
  document.getElementById('container').appendChild(renderer.domElement);

  // Add OrbitControls for interactive camera movement.
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Smooth camera movements.
  controls.dampingFactor = 0.05;

  // Add a point light at the center to simulate the high energy of the Big Bang.
  const pointLight = new THREE.PointLight(0xffffff, 1.5, 1000);
  pointLight.position.set(0, 0, 0);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // Add a soft ambient light.
  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  // Create the explosion particle system.
  createExplosionParticles();

  // Set up the UI controls.
  setupGUI();

  // Listen for window resize events.
  window.addEventListener('resize', onWindowResize, false);
}

/**
 * Creates the explosion particle system representing the initial Big Bang.
 * Each particle starts near the singularity and expands outward with a unique velocity.
 */
function createExplosionParticles() {
  // Create a BufferGeometry for the explosion particles.
  explosionGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(explosionParams.particleCount * 3);
  const colors = new Float32Array(explosionParams.particleCount * 3);
  const sizes = new Float32Array(explosionParams.particleCount);

  const color = new THREE.Color();

  // Initialize each particle.
  for (let i = 0; i < explosionParams.particleCount; i++) {
    // Start the particle within a very small radius around the origin.
    const r = Math.random() * 0.1;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Set an initial bright color (a warm white/orange).
    color.setHSL(0.1, 1.0, 0.8);
    colors[i * 3]     = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Set the particle size.
    sizes[i] = 2.0;

    // Determine a random velocity vector for this particle.
    const vx = (Math.random() - 0.5);
    const vy = (Math.random() - 0.5);
    const vz = (Math.random() - 0.5);
    // Normalize the velocity vector.
    const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
    explosionVelocities.push({
      x: (vx / len) * (Math.random() * 5 + 2),
      y: (vy / len) * (Math.random() * 5 + 2),
      z: (vz / len) * (Math.random() * 5 + 2)
    });
  }

  // Set the geometry attributes.
  explosionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  explosionGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  explosionGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create a PointsMaterial for the explosion particles.
  // A custom-generated texture (see generateParticleTexture) gives a glowing effect.
  const texture = generateParticleTexture();
  explosionMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Create the Points object and add it to the scene.
  explosionParticles = new THREE.Points(explosionGeometry, explosionMaterial);
  scene.add(explosionParticles);
}

/**
 * Generates a circular gradient texture to simulate glowing particles.
 * @returns {THREE.Texture} The generated texture.
 */
function generateParticleTexture() {
  // Create a canvas element.
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  // Draw a radial gradient on the canvas.
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 0, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  // Create and return a texture from the canvas.
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a secondary particle system representing galaxies, nebulae, and star clusters.
 * This system is added once the explosion has expanded beyond a certain threshold.
 */
function createGalaxyParticles() {
  // Create a BufferGeometry for the galaxy particles.
  galaxyGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(galaxyParams.particleCount * 3);
  const colors = new Float32Array(galaxyParams.particleCount * 3);
  const sizes = new Float32Array(galaxyParams.particleCount);

  const color = new THREE.Color();

  // Distribute the galaxy particles randomly in a larger spherical volume.
  for (let i = 0; i < galaxyParams.particleCount; i++) {
    const r = Math.random() * galaxyParams.galaxySpread + 50; // Ensure a minimum distance from center.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Use a softer, bluish tint for galaxies.
    color.setHSL(0.6, 0.7, 0.7);
    colors[i * 3]     = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 2.5;
  }

  galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  galaxyGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create PointsMaterial using the same glowing texture.
  const texture = generateParticleTexture();
  galaxyMaterial = new THREE.PointsMaterial({
    size: 2.5,
    vertexColors: true,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  galaxyParticles = new THREE.Points(galaxyGeometry, galaxyMaterial);
  scene.add(galaxyParticles);
}

/**
 * Sets up the dat.GUI interface to allow interactive control of simulation parameters.
 */
function setupGUI() {
  gui = new dat.GUI();
  
  // Folder for explosion parameters.
  const explosionFolder = gui.addFolder('Explosion');
  explosionFolder.add(explosionParams, 'expansionSpeed', 0.1, 5.0).name('Expansion Speed');
  explosionFolder.add(explosionParams, 'particleCount', 1000, 20000).step(1000).name('Particle Count').onFinishChange(function(value) {
    // Recreate the explosion particle system if particle count changes.
    scene.remove(explosionParticles);
    explosionVelocities = [];
    explosionParams.particleCount = value;
    createExplosionParticles();
  });
  explosionFolder.open();

  // Folder for galaxy parameters.
  const galaxyFolder = gui.addFolder('Galaxy');
  galaxyFolder.add(galaxyParams, 'galaxySpread', 100, 1000).name('Galaxy Spread');
  galaxyFolder.add(galaxyParams, 'particleCount', 1000, 10000).step(500).name('Galaxy Particle Count');
  galaxyFolder.open();
}

/**
 * Handles window resize events to adjust camera and renderer dimensions.
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * The main animation loop.
 * Updates simulation parameters, moves particles, and renders the scene.
 */
function animate() {
  requestAnimationFrame(animate);

  // Update the explosion simulation time.
  const delta = clock.getDelta();
  explosionParams.explosionTime += delta * explosionParams.expansionSpeed;

  // Update the explosion particle positions:
  // Each particle moves outward from the center according to its velocity and the elapsed time.
  const positions = explosionGeometry.attributes.position.array;
  for (let i = 0; i < explosionParams.particleCount; i++) {
    positions[i * 3]     = explosionVelocities[i].x * explosionParams.explosionTime;
    positions[i * 3 + 1] = explosionVelocities[i].y * explosionParams.explosionTime;
    positions[i * 3 + 2] = explosionVelocities[i].z * explosionParams.explosionTime;
  }
  explosionGeometry.attributes.position.needsUpdate = true;

  // Once the explosion has expanded past a threshold, add the galaxy particles (if not already added).
  if (!galaxyParams.created && explosionParams.explosionTime > 10) {
    createGalaxyParticles();
    galaxyParams.created = true;
  }

  // Optionally, slowly rotate the galaxy particle system to add a dynamic feel.
  if (galaxyParticles) {
    galaxyParticles.rotation.y += 0.0005;
  }

  // Update camera controls.
  controls.update();

  // Render the scene.
  renderer.render(scene, camera);
}
