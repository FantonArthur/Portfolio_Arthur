import './style.scss'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { gsap } from 'gsap';  // Animation intro


// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, -100);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// s'assurer que la caméra démarre à z=100 (intro)
// camera.position.set(0, 0, -100);

// Animation intro (Texte)
const instructions = document.getElementById('instructions');


// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);

// Helpers
// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper);
const gridhelper = new THREE.GridHelper(200, 50);

scene.add(pointLight, ambientLight, gridhelper);

// PointerLockControls pour contrôle libre (regarder + marcher)
const controls = new PointerLockControls(camera, renderer.domElement);

// Click pour verrouiller le pointeur (look around)
document.addEventListener('click', () => {
  controls.lock();
});

// Movement state
const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false };
const SPEED = 20; // unités par seconde, ajuster si besoin

// Intro control
let introStarted = false;
let introFinished = false;
let _pendingScaleAnimation = false;
function startIntro() {
  if (introStarted) return;
  introStarted = true;
  introFinished = false;
  gsap.to(camera.position, {
    z: 0,
    duration: 8,
    ease: 'power2.inOut',
    delay: 0.5,
    onUpdate: () => {
      camera.lookAt(0, 0, -100);
      if (controls && typeof controls.update === 'function') controls.update();
    },
    onComplete: () => {
      introFinished = true;
      console.log('Intro finie !');
      // Si le texte est déjà créé, animer son scale, sinon marquer en attente
      try {
        if (typeof textMesh !== 'undefined' && textMesh) {
          gsap.to(textMesh.scale, { x: 3, y: 3, z: 3, duration: 1.2, ease: 'elastic.out(1, 0.5)' });
        } else {
          _pendingScaleAnimation = true;
        }
        // Faire disparaître les instructions (fade out puis display none)
      try {
        if (instructions) {
          gsap.to(instructions, { opacity: 0, duration: 0.8, onComplete: () => { instructions.style.display = 'none'; } });
        }
      } catch (e) {
        if (instructions) instructions.style.display = 'none';
      }
      } catch (e) {
        _pendingScaleAnimation = true;
      }
    }
  });
}

function onKeyDown(event) {
  // Pendant l'intro, n'autoriser que Space (et Escape pour unlock)
  if (!introFinished) {
    if (event.code === 'Space') { moveState.up = true; startIntro(); }
    if (event.code === 'Escape') { controls.unlock(); }
    return;
  }

  switch (event.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'Space': moveState.up = true; break;
    case 'Escape': controls.unlock(); break;
    case 'ShiftLeft': moveState.down = true; break;
  }
}

function onKeyUp(event) {
  // Pendant l'intro, n'autoriser que Space release
  if (!introFinished) {
    if (event.code === 'Space') moveState.up = false;
    return;
  }

  switch (event.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
    case 'Space': moveState.up = false; break;
    case 'ShiftLeft': moveState.down = false; break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

let prevTime = performance.now();

// Marqueur placé au centre du champ de vue (quelques unités devant la caméra)
const MARKER_DISTANCE = 10; // distance devant la caméra
const markerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
const cameraMarker = new THREE.Mesh(markerGeometry, markerMaterial);
scene.add(cameraMarker);
const _cameraDir = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  // torus retiré — pas d'animation pour l'anneau

  // Déplacement basé sur PointerLockControls
  const time = performance.now();
  const delta = (time - prevTime) / 1000; // en secondes
  prevTime = time;

  // Calcul direction
  const moveZ = (moveState.forward ? 1 : 0) - (moveState.backward ? 1 : 0);
  const moveX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
  const moveY = (moveState.up ? 1 : 0) - (moveState.down ? 1 : 0);

  if (controls.isLocked) {
    if (moveZ !== 0) controls.moveForward(moveZ * SPEED * delta);
    if (moveX !== 0) controls.moveRight(moveX * SPEED * delta);
    if (moveY !== 0) camera.position.y += moveY * SPEED * delta;
  }

  // (overlay titre désactivé)
  // Met à jour la position du marqueur devant la caméra
  camera.getWorldDirection(_cameraDir);
  cameraMarker.position.copy(camera.position).add(_cameraDir.multiplyScalar(MARKER_DISTANCE));
  renderer.render(scene, camera);
}

animate();

// Texte 
const loader = new FontLoader();
const fontUrl = new URL('./fonts/Soloist Laser_Regular.json', import.meta.url).href;
const font = await loader.loadAsync(fontUrl);
const textGeometry = new TextGeometry("Arthur Fanton\nExplore My Room", {
  font: font,
  size: 4,
  height: 2,
  depth: 1,
  curveSegments: 12,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.1,
  bevelOffset: 0,
  bevelSegments: 5
});
// Centrer le pivot de la géométrie au milieu du texte
textGeometry.computeBoundingBox();
if (textGeometry.boundingBox) {
  const center = new THREE.Vector3();
  textGeometry.boundingBox.getCenter(center);
  textGeometry.translate(-center.x, -center.y, -center.z);
}
const textMesh = new THREE.Mesh(textGeometry, [
  new THREE.MeshPhongMaterial({ color: "#A67C52" }), // front
  new THREE.MeshPhongMaterial({ color: "#F5F5DC" })  // side
]);
textMesh.position.set(0, 0, -130);
scene.add(textMesh);



// Stars
function addStar() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}
Array(200).fill().forEach(addStar);

// Background
// Couleur de fond et brouillard léger
renderer.setClearColor(0x5A7D9A);
scene.fog = new THREE.FogExp2(0x5A7D9A, 0.0015);

// Ajuster la taille du canvas et l'aspect quand la fenêtre change
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

// Fin du fichier — autres ajouts possibles : audio, interaction, textures...