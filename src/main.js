import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(30);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
renderer.render(scene, camera);


const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

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

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;
  // torus.scale.x = 1 + 0.3 * Math.sin(Date.now() * 0.005);

  controls.update();
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
const esapceTexture = new THREE.TextureLoader().load('images/espace.jpg');
const esapce = new THREE.Mesh(
  new THREE.SphereGeometry(4, 10, 10),
  new THREE.MeshBasicMaterial({ map: esapceTexture }),
);
esapce.position.z = -20;
esapce.position.x = 23;
esapce.position.y = -12;
scene.add(esapce);
