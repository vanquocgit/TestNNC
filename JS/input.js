import { APP } from './globals.js';
import { STATE } from './config.js';

export function setupTouchAndClick() {
    const container = document.getElementById('canvas-container');
    container.addEventListener('pointerdown', (e) => { STATE.touch.active = true; STATE.touch.startX = e.clientX; STATE.touch.startY = e.clientY; STATE.touch.lastX = e.clientX; STATE.touch.lastY = e.clientY; });
    window.addEventListener('pointermove', (e) => { if (!STATE.touch.active) return; const deltaX = e.clientX - STATE.touch.lastX; const deltaY = e.clientY - STATE.touch.lastY; STATE.rotation.y += deltaX * 0.005; STATE.rotation.x += deltaY * 0.002; STATE.rotation.x = Math.max(-0.5, Math.min(0.5, STATE.rotation.x)); STATE.touch.lastX = e.clientX; STATE.touch.lastY = e.clientY; });
    window.addEventListener('pointerup', (e) => { STATE.touch.active = false; });
    container.addEventListener('click', (e) => {
        const moveDist = Math.hypot(e.clientX - STATE.touch.startX, e.clientY - STATE.touch.startY); if (moveDist > 10) return;
        APP.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; APP.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        APP.raycaster.setFromCamera(APP.mouse, APP.camera);
        const intersects = APP.raycaster.intersectObjects(APP.mainGroup.children, true);
        let clickedPhoto = null;
        for (let hit of intersects) {
            let obj = hit.object;
            while (obj.parent && obj.parent !== APP.mainGroup && obj.parent !== APP.photoMeshGroup) { obj = obj.parent; }
            const particle = APP.particleSystem.find(p => p.mesh === obj && p.type === 'PHOTO');
            if (particle) { clickedPhoto = particle; break; }
        }
        if (clickedPhoto) { STATE.mode = 'FOCUS'; STATE.focusTarget = clickedPhoto.mesh; }
        else { if (STATE.mode === 'FOCUS') { STATE.mode = 'TREE'; STATE.focusTarget = null; } }
    });
    let lastTap = 0; container.addEventListener('touchend', (e) => { const currentTime = new Date().getTime(); const tapLength = currentTime - lastTap; if (tapLength < 300 && tapLength > 0) { STATE.mode = (STATE.mode === 'SCATTER') ? 'TREE' : 'SCATTER'; e.preventDefault(); } lastTap = currentTime; });
}

export function setupEvents() {
    window.addEventListener('resize', () => {
        APP.camera.aspect = window.innerWidth / window.innerHeight; APP.camera.updateProjectionMatrix(); APP.renderer.setSize(window.innerWidth, window.innerHeight); if (APP.composer) APP.composer.setSize(window.innerWidth, window.innerHeight);
    });
    const camBtn = document.getElementById('cam-btn');
    camBtn.addEventListener('click', () => { if (APP.isCameraRunning) { import('./mediapipe.js').then(m => m.stopMediaPipe()); } else { import('./mediapipe.js').then(m => m.initMediaPipe(APP)); } });
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'h') {
            const controls = document.querySelector('.controls-wrapper'); if (controls) controls.classList.toggle('ui-hidden'); const webcam = document.getElementById('webcam-wrapper'); if (webcam) webcam.classList.toggle('ui-hidden');
        } else if (key === 's') { const stats = document.getElementById('footer-stats'); if (stats) stats.classList.toggle('ui-hidden'); }
    });
}
