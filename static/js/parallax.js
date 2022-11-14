let bg = document.querySelector('#polygons');
window.addEventListener('mousemove', function(e) {
    let x = e.clientX / window.innerWidth;
    let y = e.clientY / window.innerHeight;
    bg.style.transform = 'translate(-' + x * 30 + 'px, -' + y * 30 + 'px)';
});