import './style.scss'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { gsap } from 'gsap';  // Animation intro

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// s'assurer que la caméra démarre à z=100 (intro)
// camera.position.set(0, 0, -100);
camera.position.set(0, 0, 0);
renderer.render(scene, camera);


const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// (Text 3D removed)

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

/* Animation d'intro (commentée)
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
    console.log('Intro finie !');
  }
});
*/

// Movement state
const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false };
const SPEED = 20; // unités par seconde, ajuster si besoin

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'Space': moveState.up = true; break;
    // case 'ShiftLeft': moveState.down = true; break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
    case 'Space': moveState.up = false; break;
    // case 'ShiftLeft': moveState.down = false; break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

let prevTime = performance.now();

// Titre overlay contrôlé par la position Y de la caméra
const titleEl = typeof document !== 'undefined' ? document.getElementById('title') : null;
const TITLE_Y_THRESHOLD = 5; // ajuster selon besoin

// Marqueur placé au centre du champ de vue (quelques unités devant la caméra)
const MARKER_DISTANCE = 10; // distance devant la caméra
const markerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
const cameraMarker = new THREE.Mesh(markerGeometry, markerMaterial);
scene.add(cameraMarker);
const _cameraDir = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;
  // torus.scale.x = 1 + 0.3 * Math.sin(Date.now() * 0.005);

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

  // Affiche le titre seulement quand la caméra est au-dessus du seuil
  if (titleEl) {
    const visible = camera.position.y > TITLE_Y_THRESHOLD;
    titleEl.style.opacity = visible ? '1' : '0';
    titleEl.style.transform = visible ? 'translateY(0)' : 'translateY(-6px)';
  }
  // Met à jour la position du marqueur devant la caméra
  camera.getWorldDirection(_cameraDir);
  cameraMarker.position.copy(camera.position).add(_cameraDir.multiplyScalar(MARKER_DISTANCE));
  renderer.render(scene, camera);
}

animate();

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
// const spaceTexture = new THREE.TextureLoader().load('images/espace.jpg');
// scene.background = spaceTexture;

// Avatar
const esapceTexture = new THREE.TextureLoader().load('assets/images/espace.jpg');
const esapce = new THREE.Mesh(
  new THREE.SphereGeometry(4, 10, 10),
  new THREE.MeshBasicMaterial({ map: esapceTexture }),
);
esapce.position.z = -20;
esapce.position.x = 23;
esapce.position.y = -12;
scene.add(esapce);
