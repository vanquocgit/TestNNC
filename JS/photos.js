import * as THREE from 'three';
import { APP } from './globals.js';
import { CONFIG } from './config.js';
import { updatePhotoLayout } from './particles.js';

export async function addPhotoToScene(texture) {
    const frameGeo = new THREE.BoxGeometry(1.4, 1.4, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    let width = 1.2; let height = 1.2;
    if (texture.image) {
        const aspect = texture.image.width / texture.image.height;
        if (aspect > 1) height = width / aspect; else width = height * aspect;
    }
    const photoGeo = new THREE.PlaneGeometry(width, height);
    const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.z = 0.04;
    const group = new THREE.Group();
    group.add(frame); group.add(photo);
    frame.scale.set(width / 1.2, height / 1.2, 1);
    const s = 0.8; group.scale.set(s, s, s);
    APP.photoMeshGroup.add(group);
    const mod = await import('./particles.js');
    APP.particleSystem.push(new mod.Particle(group, 'PHOTO', false));
    updatePhotoLayout();
}

export function loadPredefinedImages() {
    const loader = new THREE.TextureLoader();
    if (CONFIG.preload.autoScanLocal) {
        for (let i = 1; i <= CONFIG.preload.scanCount; i++) {
            const pathWEBP = `./IMG/${i}.webp`;
            loader.load(pathWEBP, (t) => { t.colorSpace = THREE.SRGBColorSpace; addPhotoToScene(t); }, undefined, () => {
                loader.load(pathWEBP, (t) => { t.colorSpace = THREE.SRGBColorSpace; addPhotoToScene(t); }, undefined, () => { });
            });
        }
    }
}
