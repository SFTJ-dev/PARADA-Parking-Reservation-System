const navItems = document.querySelectorAll('.navAct');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('activeNav'));
        item.classList.add('activeNav');
    });
});

const STORAGE_KEY = 'paradaData';
const TOTAL_STORAGE = '200'; //200 is example palang muna since wala pa tayong exact number

