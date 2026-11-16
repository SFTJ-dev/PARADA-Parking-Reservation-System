let elements = document.querySelectorAll('.navAct')

elements.forEach(el => {
  el.addEventListener('click', () => {
    elements.forEach(el => el.classList.remove('activeNav'))
    el.classList.add('activeNav')
  })})