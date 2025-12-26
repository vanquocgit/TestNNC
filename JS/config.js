export const CONFIG = {
    colors: { bg: 0x050d1a, fog: 0x050d1a, champagneGold: 0xffd966, deepGreen: 0x044007, accentRed: 0x990000 },
    particles: { count: 500, dustCount: 200, snowCount: 200, treeHeight: 22, treeRadius: 8 },
    camera: { z: 50 },
    preload: { autoScanLocal: true, scanCount: 35, images: [] }
};

export const STATE = { mode: 'TREE', focusIndex: -1, focusTarget: null, hand: { detected: false, x: 0, y: 0 }, rotation: { x: 0, y: 0 }, touch: { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0 } };

export function setMode(mode, APP) {
    if (mode === 'FOCUS_RANDOM') {
        STATE.mode = 'FOCUS';
        const photos = APP.particleSystem.filter(p => p.type === 'PHOTO');
        if (photos.length) STATE.focusTarget = photos[Math.floor(Math.random() * photos.length)].mesh;
    } else {
        STATE.mode = mode;
        if (mode === 'TREE') STATE.focusTarget = null;
    }
}
