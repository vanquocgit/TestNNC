export function showMsg(txt) {
    const box = document.getElementById('msg-box');
    if (!box) return;
    box.innerText = txt; box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 3000);
}
