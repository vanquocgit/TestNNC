import * as THREE from 'three';
import { APP } from './globals.js';
import { CONFIG, STATE, setMode as cfgSetMode } from './config.js';
import { initThree, setupEnvironment, setupLights, setupPostProcessing, createRaycasterAndMouse } from './threeSetup.js';
import { createTextures } from './textures.js';
import { createParticles, createDust } from './particles.js';
import { createSnow, updateSnow } from './particles.js';
import { loadPredefinedImages } from './photos.js';
import { setupTouchAndClick, setupEvents } from './input.js';
import { showMsg } from './utils.js';

const clock = new THREE.Clock();

window.setMode = (mode) => { cfgSetMode(mode, APP); };

export async function init() {
    initThree(); createRaycasterAndMouse(); setupEnvironment(); setupLights(); createTextures(); createParticles(clock, THREE); createDust(); createSnow(); await loadPredefinedImages(); setupPostProcessing(); setupEvents(); setupTouchAndClick();
    const loader = document.getElementById('loader');
    try {
        const minShowMs = 800; const tStart = performance.now();
        await new Promise((resolve) => { requestAnimationFrame(() => { try { if (APP.composer) APP.composer.render(); else APP.renderer.render(APP.scene, APP.camera); } catch (e) { } requestAnimationFrame(resolve); }); });
        const elapsed = performance.now() - tStart; const wait = Math.max(0, minShowMs - elapsed);
        setTimeout(() => { loader.style.opacity = 0; setTimeout(() => loader.remove(), 800); }, wait);
    } catch (e) { loader.style.opacity = 0; setTimeout(() => loader.remove(), 800); }
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (STATE.hand.detected) {
        if (STATE.mode === 'SCATTER') {
            const targetRotY = STATE.hand.x * Math.PI * 0.9; const targetRotX = STATE.hand.y * Math.PI * 0.25;
            STATE.rotation.y += (targetRotY - STATE.rotation.y) * 3.0 * dt; STATE.rotation.x += (targetRotX - STATE.rotation.x) * 3.0 * dt;
        } else { STATE.rotation.y += 0.3 * dt; }
    } else if (STATE.touch.active) { } else { if (STATE.mode === 'TREE') { STATE.rotation.y += 0.3 * dt; STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt; } else { STATE.rotation.y += 0.1 * dt; } }
    if (APP.mainGroup) { APP.mainGroup.rotation.y = STATE.rotation.y; APP.mainGroup.rotation.x = STATE.rotation.x; }
    APP.particleSystem.forEach(p => { try { p.update(dt, STATE.mode, STATE.focusTarget, clock, APP.camera, APP.mainGroup); } catch (e) { } });
    updateSnow(clock);
    try { if (APP.composer) APP.composer.render(); else APP.renderer.render(APP.scene, APP.camera); } catch (e) { }
}

(function () {
    // tạo popup (tạo 1 lần)
    function createInfoPopup() {
        if (document.getElementById('info-popup')) return;
        const p = document.createElement('div');
        p.id = 'info-popup';
        p.innerHTML = `
            <div class="info-backdrop" style="
                position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:500; ">
                <div style="border: 2px solid #d4af37;background: #0b0f1487;color:#fff;padding:18px;border-radius:10px;max-width:520px;width: 80%;box-shadow:0 10px 40px rgba(0,0,0,0.6);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <strong>Hướng dẫn sử dụng</strong>
                        <button id="info-close" style="background:transparent;border:0;color:#d4af37;font-size:18px;cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:14px;line-height:1.5;color:#ddd;font-family: 'Cactus Classical Serif', serif;">
                        • 🖐️ Chế độ tương tác(yêu cầu dùng camera)<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;• Xòe 5 ngón tay và di chuyển để - giải phóng không gian<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;• Nắm tay - hiển thị cây noel<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;• Chạm ngón trỏ và ngón cái -  phóng to ảnh<br/>
                        • 🎄 Hiển thị cây noel<br/>
                        • ✨ Giải phóng không gian<br/>
                        • 🔍 Phóng to ảnh<br/>
                        • 🖼️ Mở thư mục ảnh
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(p);
        p.querySelector('#info-close').addEventListener('click', hideInfoPopup);
        p.querySelector('.info-backdrop').addEventListener('click', function (e) {
            if (e.target === this) hideInfoPopup();
        });
    }

    function showInfoPopup() {
        createInfoPopup();
        const el = document.getElementById('info-popup');
        if (el) el.style.display = 'block';
    }

    function hideInfoPopup() {
        const el = document.getElementById('info-popup');
        if (el) el.style.display = 'none';
    }

    // bảo toàn setMode hiện có nếu đã định nghĩa, rồi mở popup khi mode === 'INFORM'
    const _oldSetMode = window.setMode;
    window.setMode = function (mode, ...args) {
        if (mode === 'INFORM') {
            showInfoPopup();
            return;
        }
        if (typeof _oldSetMode === 'function') return _oldSetMode(mode, ...args);
        // nếu không có setMode gốc, có thể xử lý mặc định ở đây
    };

    // (tuỳ chọn) expose helpers để dùng console hoặc test
    window.__showInfoPopup = showInfoPopup;
    window.__hideInfoPopup = hideInfoPopup;
})();

init();
