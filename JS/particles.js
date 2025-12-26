import * as THREE from 'three';
import { APP } from './globals.js';
import { CONFIG } from './config.js';

export function createSnow() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const velocities = [];
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.beginPath(); context.arc(16, 16, 16, 0, Math.PI * 2); context.fill();
    const snowTexture = new THREE.CanvasTexture(canvas);
    for (let i = 0; i < CONFIG.particles.snowCount; i++) {
        vertices.push(THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloatSpread(60), THREE.MathUtils.randFloatSpread(60));
        velocities.push(Math.random() * 0.2 + 0.1, Math.random() * 0.05);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('userData', new THREE.Float32BufferAttribute(velocities, 2));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, map: snowTexture, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    APP.snowSystem = new THREE.Points(geometry, material);
    APP.scene.add(APP.snowSystem);
}

export function updateSnow(clock) {
    if (!APP.snowSystem) return;
    const positions = APP.snowSystem.geometry.attributes.position.array;
    const userData = APP.snowSystem.geometry.attributes.userData.array;
    for (let i = 0; i < CONFIG.particles.snowCount; i++) {
        const fallSpeed = userData[i * 2];
        positions[i * 3 + 1] -= fallSpeed;
        const swaySpeed = userData[i * 2 + 1];
        positions[i * 3] += Math.sin(clock.elapsedTime * 2 + i) * swaySpeed * 0.1;
        if (positions[i * 3 + 1] < -30) {
            positions[i * 3 + 1] = 30;
            positions[i * 3] = THREE.MathUtils.randFloatSpread(100);
            positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(60);
        }
    }
    APP.snowSystem.geometry.attributes.position.needsUpdate = true;
}

export class Particle {
    constructor(mesh, type, isDust = false) {
        this.mesh = mesh; this.type = type; this.isDust = isDust; this.posTree = new THREE.Vector3(); this.posScatter = new THREE.Vector3(); this.baseScale = mesh.scale.x; const speedMult = (type === 'PHOTO') ? 0.3 : 2.0; this.spinSpeed = new THREE.Vector3((Math.random() - 0.5) * speedMult, (Math.random() - 0.5) * speedMult, (Math.random() - 0.5) * speedMult); this.calculatePositions();
    }
    calculatePositions() {
        if (this.type === 'PHOTO') {
            this.posTree.set(0, 0, 0);
            const rScatter = 8 + Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.posScatter.set(rScatter * Math.sin(phi) * Math.cos(theta), rScatter * Math.sin(phi) * Math.sin(theta), rScatter * Math.cos(phi));
            return;
        }
        const h = CONFIG.particles.treeHeight;
        let t = Math.pow(Math.random(), 0.8);
        const y = (t * h) - (h / 2);
        let rMax = Math.max(0.5, CONFIG.particles.treeRadius * (1.0 - t));
        const angle = t * 50 * Math.PI + Math.random() * Math.PI;
        const r = rMax * (0.8 + Math.random() * 0.4);
        this.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        let rScatter = this.isDust ? (12 + Math.random() * 20) : (8 + Math.random() * 12);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        this.posScatter.set(rScatter * Math.sin(phi) * Math.cos(theta), rScatter * Math.sin(phi) * Math.sin(theta), rScatter * Math.cos(phi));
    }
    update(dt, mode, focusTargetMesh, clock, camera, mainGroup) {
        let target = (mode === 'SCATTER') ? this.posScatter : this.posTree;
        if (mode === 'FOCUS') {
            if (this.mesh === focusTargetMesh) {
                const desiredWorldPos = new THREE.Vector3(-0.5, 2, 35);
                const invMatrix = new THREE.Matrix4().copy(mainGroup.matrixWorld).invert();
                target = desiredWorldPos.applyMatrix4(invMatrix);
            } else target = this.posScatter;
        }
        const lerpSpeed = (mode === 'FOCUS' && this.mesh === focusTargetMesh) ? 5.0 : 2.0;
        this.mesh.position.lerp(target, lerpSpeed * dt);
        if (mode === 'SCATTER') {
            this.mesh.rotation.x += this.spinSpeed.x * dt;
            this.mesh.rotation.y += this.spinSpeed.y * dt;
            this.mesh.rotation.z += this.spinSpeed.z * dt;
        } else if (mode === 'TREE') {
            if (this.type === 'PHOTO') {
                this.mesh.lookAt(0, this.mesh.position.y, 0);
                this.mesh.rotateY(Math.PI);
            } else {
                this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt);
                this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt);
                this.mesh.rotation.y += 0.5 * dt;
            }
        }
        if (mode === 'FOCUS' && this.mesh === focusTargetMesh) this.mesh.lookAt(camera.position);
        let s = this.baseScale;
        if (this.isDust) {
            s = this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id));
            if (mode === 'TREE') s = 0;
        } else if (mode === 'SCATTER' && this.type === 'PHOTO') s = this.baseScale * 2.5;
        else if (mode === 'FOCUS') {
            if (this.mesh === focusTargetMesh) s = 4.5; else s = this.baseScale * 0.8;
        }
        this.mesh.scale.lerp(new THREE.Vector3(s, s, s), 4 * dt);
    }
}

export function createParticles(clock, THREElib) {
    const sphereGeo = new THREElib.SphereGeometry(0.9, 38, 38);
    const boxGeo = new THREElib.BoxGeometry(1, 1, 1);
    const curve = new THREElib.CatmullRomCurve3([new THREElib.Vector3(0, -0.5, 0), new THREElib.Vector3(0, 0.3, 0), new THREElib.Vector3(0.1, 0.5, 0), new THREElib.Vector3(0.3, 0.4, 0)]);
    const candyGeo = new THREElib.TubeGeometry(curve, 40, 0.09, 20, false);
    const goldMat = new THREElib.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1, envMapIntensity: 2.0, emissive: 0x443300, emissiveIntensity: 0.3 });
    const greenMat = new THREElib.MeshStandardMaterial({ color: CONFIG.colors.deepGreen, metalness: 0.2, roughness: 0.8, emissive: 0x002200, emissiveIntensity: 0.2 });
    const redMat = new THREElib.MeshPhysicalMaterial({ color: CONFIG.colors.accentRed, metalness: 0.3, roughness: 0.2, clearcoat: 1.0, emissive: 0x330000 });
    const candyMat = new THREElib.MeshStandardMaterial({ map: APP.caneTexture, roughness: 0.4 });
    for (let i = 0; i < CONFIG.particles.count; i++) {
        const rand = Math.random();
        let mesh, type;
        if (rand < 0.40) { mesh = new THREElib.Mesh(boxGeo, greenMat); type = 'BOX'; }
        else if (rand < 0.70) { mesh = new THREElib.Mesh(boxGeo, goldMat); type = 'GOLD_BOX'; }
        else if (rand < 0.92) { mesh = new THREElib.Mesh(sphereGeo, goldMat); type = 'GOLD_SPHERE'; }
        else if (rand < 0.97) { mesh = new THREElib.Mesh(sphereGeo, redMat); type = 'RED'; }
        else { mesh = new THREElib.Mesh(candyGeo, candyMat); type = 'CANE'; }
        const s = 0.4 + Math.random() * 0.5; mesh.scale.set(s, s, s); mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        APP.mainGroup.add(mesh);
        APP.particleSystem.push(new Particle(mesh, type, false));
    }
    const starShape = new THREElib.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points + Math.PI / 2;
        const r = (i % 2 === 0) ? 1.5 : 0.7;
        const x = Math.cos(angle) * r; const y = Math.sin(angle) * r;
        if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREElib.ExtrudeGeometry(starShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 });
    starGeo.center();
    const starMat = new THREElib.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 1.0, metalness: 1.0, roughness: 0 });
    const star = new THREElib.Mesh(starGeo, starMat);
    star.position.set(0, CONFIG.particles.treeHeight / 2 + 1.2, 0);
    APP.mainGroup.add(star);
    APP.mainGroup.add(APP.photoMeshGroup);
}

export function createDust() {
    const geo = new THREE.TetrahedronGeometry(0.08, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });
    for (let i = 0; i < CONFIG.particles.dustCount; i++) {
        const mesh = new THREE.Mesh(geo, mat); mesh.scale.setScalar(0.5 + Math.random());
        APP.mainGroup.add(mesh);
        APP.particleSystem.push(new Particle(mesh, 'DUST', true));
    }
}

export function updatePhotoLayout() {
    const photos = APP.particleSystem.filter(p => p.type === 'PHOTO');
    const count = photos.length; if (count === 0) return;
    const h = CONFIG.particles.treeHeight * 0.9; const bottomY = -h / 2; const stepY = h / count; const loops = 3;
    photos.forEach((p, i) => {
        const y = bottomY + stepY * i + stepY / 2;
        const normalizedH = (y + h / 2) / CONFIG.particles.treeHeight;
        const r = Math.max(1.0, CONFIG.particles.treeRadius * (1.0 - normalizedH)) + 3.0;
        const angle = normalizedH * Math.PI * 2 * loops + (Math.PI / 4);
        p.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    });
}
