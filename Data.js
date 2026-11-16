let elements = document.querySelectorAll('.navLinks')

elements.forEach(el => {
  el.addEventListener('click', () => {
    elements.forEach(el => el.classList.remove('active'))
    el.classList.add('active')
  })})