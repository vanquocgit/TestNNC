import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { APP } from './globals.js';
import { STATE } from './config.js';

export async function initMediaPipe() {
    if (APP.isCameraRunning) return;
    const camBtn = document.getElementById('cam-btn');
    camBtn.innerText = "Đang tải...";
    const debugInfo = document.getElementById('debug-info');
    debugInfo.innerText = "Loading AI models...";
    APP.video = document.getElementById('webcam');
    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        APP.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" },
            runningMode: "VIDEO", numHands: 1
        });

        APP.video.setAttribute('playsinline', ''); APP.video.setAttribute('webkit-playsinline', ''); 
        APP.video.muted = true; APP.video.playsInline = true;
        
        const constraints = { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        APP.video.srcObject = stream;
        APP.video.addEventListener("loadeddata", predictWebcam);
        document.getElementById('webcam-wrapper').style.opacity = 1;
        debugInfo.innerText = "Gesture Active: Show Hand";
        camBtn.innerText = "✔️"; camBtn.classList.add('active');
        APP.isCameraRunning = true;
    } catch (e) {
        console.warn("Camera error:", e);
        let msg = "Camera Error: " + e.name;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') msg = "Please allow camera access!";
        else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') msg = "HTTPS required for camera!";
        debugInfo.innerText = msg; try { const box = document.getElementById('msg-box'); box.innerText = msg; box.style.display = 'block'; setTimeout(() => box.style.display = 'none', 3000); } catch (e){}
        camBtn.innerText = "Retry Camera";
    }
}

export function stopMediaPipe() {
    if (!APP.isCameraRunning) return;
    try {
        const stream = APP.video && APP.video.srcObject;
        if (stream) {
            const tracks = (typeof stream.getTracks === 'function') ? stream.getTracks() : [];
            tracks.forEach(t => { try { t.stop(); } catch (e) { } });
        }
        if (APP.video) { APP.video.pause(); APP.video.srcObject = null; }
    } catch (e) { }
    try { if (APP.handLandmarker && typeof APP.handLandmarker.close === 'function') APP.handLandmarker.close(); } catch (e) {}
    APP.handLandmarker = null;
    APP.isCameraRunning = false;
    const camBtn = document.getElementById('cam-btn'); camBtn.innerText = "🖐️"; camBtn.classList.remove('active');
    const ww = document.getElementById('webcam-wrapper'); if (ww) ww.style.opacity = 0;
    STATE.hand.detected = false;
    document.getElementById('debug-info').innerText = "Gesture stopped";
}

let lastVideoTime = -1;
export async function predictWebcam() {
    if (!APP.isCameraRunning) return;
    try {
        if (APP.video.currentTime !== lastVideoTime) {
            lastVideoTime = APP.video.currentTime;
            if (APP.handLandmarker) {
                const result = APP.handLandmarker.detectForVideo(APP.video, performance.now());
                processGestures(result);
            }
        }
    } catch (e) { console.warn('predictWebcam error', e); }
    if (APP.isCameraRunning) requestAnimationFrame(predictWebcam);
}

export function processGestures(result) {
    if (result.landmarks && result.landmarks.length > 0) {
        STATE.hand.detected = true;
        const lm = result.landmarks[0];
        STATE.hand.x = (lm[9].x - 0.5) * 2; STATE.hand.y = (lm[9].y - 0.5) * 2;
        const wrist = lm[0]; const middleMCP = lm[9];
        const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);
        if (handSize < 0.02) return;
        const tips = [lm[8], lm[12], lm[16], lm[20]];
        let avgTipDist = 0; tips.forEach(t => avgTipDist += Math.hypot(t.x - wrist.x, t.y - wrist.y)); avgTipDist /= 4;
        const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
        const extensionRatio = avgTipDist / handSize; const pinchRatio = pinchDist / handSize;
        document.getElementById('debug-info').innerText = `Gesture Detected: ${STATE.mode}`;
        if (extensionRatio < 1.5) { STATE.mode = 'TREE'; STATE.focusTarget = null; }
        else if (pinchRatio < 0.35) {
            if (STATE.mode !== 'FOCUS') { STATE.mode = 'FOCUS'; const photos = APP.particleSystem.filter(p => p.type === 'PHOTO'); if (photos.length) STATE.focusTarget = photos[Math.floor(Math.random() * photos.length)].mesh; }
        } else if (extensionRatio > 1.7) { STATE.mode = 'SCATTER'; STATE.focusTarget = null; }
    } else { STATE.hand.detected = false; }
}
