import './style.scss'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { gsap } from 'gsap';  // Animation intro
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';


// Scene
const scene = new THREE.Scene();
// === FBX Loader pour les lunettes ===
let lunettesObject = null; // Référence pour le raycast
const fbxLoader = new FBXLoader();
fbxLoader.load('./assets/obj/lunettes.fbx', (object) => {
  object.scale.set(6, 6, 6);
  object.position.set(0, 0, 0); // Ajuste la position si besoin
  object.name = 'lunettes'; // Nom pour identifier l'objet
  lunettesObject = object;
  scene.add(object);
});
// ===== RAYCAST INTERACTION SYSTEM (variables globales) =====
const raycaster = new THREE.Raycaster();
const interactHint = document.getElementById('interact-hint');
const boueePanel = document.getElementById('bouee-panel');
const lunettesPanel = document.getElementById('lunettes-panel');
let isHoveringBouee = false;
let isHoveringLunettes = false;
let currentHoveredObject = null; // Pour savoir quel objet est survolé
// === OBJ/MTL Loader ===
// Bouée
let boueeObject = null; // Référence pour le raycast
const mtlLoaderBouee = new MTLLoader();
mtlLoaderBouee.load('./assets/obj/bouee.mtl', (materials) => {
  materials.preload();
  const objLoaderBouee = new OBJLoader();
  objLoaderBouee.setMaterials(materials);
  objLoaderBouee.load('./assets/obj/bouee.obj', (object) => {
    object.position.set(0, 0, 0); // Ajuste la position si besoin
    object.scale.set(6, 6, 6);   // Scale x6
    object.name = 'bouee'; // Nom pour identifier l'objet
    boueeObject = object;
    scene.add(object);
  });
});
// const mtlLoader = new MTLLoader();
// mtlLoader.load('./assets/obj/test.mtl', (materials) => {
//   materials.preload();
//   const objLoader = new OBJLoader();
//   objLoader.setMaterials(materials);
//   objLoader.load('./assets/obj/test.obj', (object) => {
//     object.position.set(0, -5, 0); // Ajuste la position si besoin
//     object.scale.set(6, 6, 6);   // Ajuste la taille si besoin
//     scene.add(object);
//   });
// });

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
  
  // Vérifier interaction avec la bouée
  updateInteractionHint();
  
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

// ===== CREDITS & CONTACT PANELS =====
const creditsBtn = document.getElementById('credits-btn');
const contactBtn = document.getElementById('contact-btn');
const creditsPanel = document.getElementById('credits-panel');
const contactPanel = document.getElementById('contact-panel');

// Fonction pour ouvrir un panneau avec animation
function openPanel(panel) {
  // Fermer l'autre panneau si ouvert
  document.querySelectorAll('.info-panel').forEach(p => {
    if (p !== panel) p.classList.remove('active');
  });

  // Désactive le lock de la souris si panneau bouée, crédits, contact ou lunettes
  if ((panel.id === 'bouee-panel' || panel.id === 'credits-panel' || panel.id === 'contact-panel' || panel.id === 'lunettes-panel') && controls.isLocked) {
    controls.unlock();
  }

  // Animer l'ouverture avec GSAP pour plus de fluidité
  gsap.fromTo(panel, 
    { opacity: 0 },
    { opacity: 1, duration: 0.3, ease: 'power2.out' }
  );

  panel.classList.add('active');

  // Animation du contenu depuis le bouton (bas gauche)
  const content = panel.querySelector('.panel-content');
  gsap.fromTo(content,
    { 
      x: -100, 
      y: 100, 
      scale: 0.8, 
      opacity: 0 
    },
    { 
      x: 0, 
      y: 0, 
      scale: 1, 
      opacity: 1, 
      duration: 0.5, 
      ease: 'back.out(1.7)' 
    }
  );
}

// Fonction pour fermer un panneau
function closePanel(panel) {
  const content = panel.querySelector('.panel-content');

  gsap.to(content, {
    x: -50,
    y: 50,
    scale: 0.9,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in'
  });

  gsap.to(panel, {
    opacity: 0,
    duration: 0.3,
    delay: 0.1,
    ease: 'power2.in',
    onComplete: () => {
      panel.classList.remove('active');
      // Réactive le lock de la souris si panneau bouée, crédits ou contact (PAS lunettes)
      if ((panel.id === 'bouee-panel' || panel.id === 'credits-panel' || panel.id === 'contact-panel') && !controls.isLocked) {
        controls.lock();
      }
    }
  });
}

// Event listeners pour les boutons
creditsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openPanel(creditsPanel);
});

contactBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openPanel(contactPanel);
});

// Fermer les panneaux avec les boutons X
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = btn.closest('.info-panel');
    closePanel(panel);
  });
});

// Fermer en cliquant en dehors du contenu
document.querySelectorAll('.info-panel').forEach(panel => {
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      closePanel(panel);
    }
  });
});

// Fermer avec la touche Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.info-panel.active').forEach(panel => {
      closePanel(panel);
    });
  }
});


// Fonction pour vérifier si on regarde la bouée
function checkBoueeRaycast() {
  if (!boueeObject || !introFinished) return false;
  
  // Direction du regard (centre de l'écran)
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  
  // Vérifier intersection avec la bouée et ses enfants
  const intersects = raycaster.intersectObject(boueeObject, true);
  
  // Distance maximale pour l'interaction
  const maxDistance = 30;
  
  if (intersects.length > 0 && intersects[0].distance < maxDistance) {
    return true;
  }
  return false;
}

// Fonction pour vérifier si on regarde les lunettes
function checkLunettesRaycast() {
  if (!lunettesObject || !introFinished) return false;
  
  // Direction du regard (centre de l'écran)
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  
  // Vérifier intersection avec les lunettes et ses enfants
  const intersects = raycaster.intersectObject(lunettesObject, true);
  
  // Distance maximale pour l'interaction
  const maxDistance = 30;
  
  if (intersects.length > 0 && intersects[0].distance < maxDistance) {
    return true;
  }
  return false;
}

// Mise à jour du hint d'interaction dans la boucle d'animation
function updateInteractionHint() {
  const hoveringBouee = checkBoueeRaycast();
  const hoveringLunettes = checkLunettesRaycast();

  if (hoveringBouee) {
    interactHint.classList.add('visible');
    isHoveringBouee = true;
    isHoveringLunettes = false;
    currentHoveredObject = 'bouee';
  } else if (hoveringLunettes) {
    interactHint.classList.add('visible');
    isHoveringBouee = false;
    isHoveringLunettes = true;
    currentHoveredObject = 'lunettes';
  } else {
    interactHint.classList.remove('visible');
    isHoveringBouee = false;
    isHoveringLunettes = false;
    currentHoveredObject = null;
  }
}

// Interaction avec E
document.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    if (isHoveringBouee && boueePanel) {
      openPanel(boueePanel);
      interactHint.classList.remove('visible');
    } else if (isHoveringLunettes && lunettesPanel) {
      openPanel(lunettesPanel);
      interactHint.classList.remove('visible');
    }
  }
});

// Fin du fichier — autres ajouts possibles : audio, interaction, textures...