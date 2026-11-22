(() => {
  const destination = new URL(document.getElementById('destination').href);
  const oldSection = window.location.hash;
  if (window.location.pathname.endsWith('/field.html')) {
    destination.hash = oldSection;
  } else if (oldSection === '#workforce') {
    destination.pathname = destination.pathname.replace(/finance\.html$/, 'field.html');
    destination.hash = oldSection;
  }
  window.location.replace(destination.href);
})();
