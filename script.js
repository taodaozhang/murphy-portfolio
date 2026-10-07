document.getElementById('year').textContent = new Date().getFullYear();
const navigation = [...document.querySelectorAll('.site-header nav a')];
const sections = ['about', 'experience', 'contact'].map(id => document.getElementById(id));
let scheduled = false;
function updateNavigation() {
  scheduled = false;
  const offset = document.querySelector('.site-header').getBoundingClientRect().height + 30;
  let current = null;
  sections.forEach(section => { if (section.getBoundingClientRect().top <= offset) current = section.id; });
  navigation.forEach(link => {
    if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); } }, {passive:true});
window.addEventListener('resize', updateNavigation);
updateNavigation();
const copyButton = document.querySelector('.copy-phone');
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText('17818485538');
    status.textContent = '已复制：17818485538';
  } catch (_) {
    status.textContent = '请手动复制：17818485538';
  }
});
