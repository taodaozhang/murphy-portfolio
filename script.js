document.getElementById('year').textContent = new Date().getFullYear();
const navigation = [...document.querySelectorAll('nav a')];
const sections = ['about', 'experience', 'contact'].map(id => document.getElementById(id));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    navigation.forEach(link => {
      if (link.hash === '#' + current.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, 0.1, 0.3] });
  sections.forEach(section => observer.observe(section));
}
