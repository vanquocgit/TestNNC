import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { APP } from './globals.js';
import { CONFIG } from './config.js';

export function initThree() {
    const container = document.getElementById('canvas-container');
    APP.scene = new THREE.Scene();
    APP.scene.background = new THREE.Color(CONFIG.colors.bg);
    APP.scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.015);
    APP.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    APP.camera.position.set(0, 2, CONFIG.camera.z);
    APP.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    APP.renderer.setSize(window.innerWidth, window.innerHeight);
    APP.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    APP.renderer.toneMapping = THREE.ReinhardToneMapping;
    APP.renderer.toneMappingExposure = 2.2;
    container.appendChild(APP.renderer.domElement);
    APP.mainGroup = new THREE.Group();
    APP.scene.add(APP.mainGroup);
    APP.photoMeshGroup = new THREE.Group();
}

export function setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(APP.renderer);
    APP.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
}

export function setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    APP.scene.add(ambient);
    const innerLight = new THREE.PointLight(0xffaa00, 2, 20);
    innerLight.position.set(0, 5, 0);
    APP.mainGroup.add(innerLight);
    const spotGold = new THREE.SpotLight(0xffcc66, 1200);
    spotGold.position.set(30, 40, 40);
    spotGold.angle = 0.5; spotGold.penumbra = 0.5;
    APP.scene.add(spotGold);
    const spotBlue = new THREE.SpotLight(0x6688ff, 800);
    spotBlue.position.set(-30, 20, -30);
    APP.scene.add(spotBlue);
    const fill = new THREE.DirectionalLight(0xffeebb, 0.8);
    fill.position.set(0, 0, 50);
    APP.scene.add(fill);
}

export function setupPostProcessing() {
    const renderScene = new RenderPass(APP.scene, APP.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.65; bloomPass.strength = 0.5; bloomPass.radius = 0.4;
    APP.composer = new EffectComposer(APP.renderer);
    APP.composer.addPass(renderScene);
    APP.composer.addPass(bloomPass);
}

export function createRaycasterAndMouse() {
    APP.raycaster = new THREE.Raycaster();
    APP.mouse = new THREE.Vector2();
}
