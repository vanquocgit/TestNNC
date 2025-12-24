import * as THREE from 'three';
import { APP } from './globals.js';

export function createTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#880000'; ctx.beginPath();
    for (let i = -128; i < 256; i += 32) {
        ctx.moveTo(i, 0); ctx.lineTo(i + 32, 128); ctx.lineTo(i + 16, 128); ctx.lineTo(i - 16, 0);
    }
    ctx.fill();
    APP.caneTexture = new THREE.CanvasTexture(canvas);
    APP.caneTexture.wrapS = THREE.RepeatWrapping; APP.caneTexture.wrapT = THREE.RepeatWrapping;
    APP.caneTexture.repeat.set(3, 3);
}
