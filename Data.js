const navItems = document.querySelectorAll('.navAct')

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('activeNav'));
        item.classList.add('activeNav');
    });
});

const STORAGE_KEY = 'paradaData';
const TOTAL_STORAGE = 200; //200 is example palang muna since wala pa tayong exact number

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (err) {
        console.error('Could not read localStorage:', err);
    }
    return {
        reserved: 0,
        history: []
    };
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
        console.error('Could not write to localStorage:', err);
    }
}

let data = loadData();

function renderSlots() {
    const available = TOTAL_STORAGE - data.reserved;
    const percent = (available / TOTAL_STORAGE) * 100;

    document.getElementById('slotAvailable').textContent = available;
    document.getElementById('slotTotal').textContent = TOTAL_STORAGE;
    document.getElementById('slotBarFill').style.width = percent + '%';

    const card = document.getElementById('slotCard');
    const status = document.getElementById('slotStatus');
    card.classList.remove('low', 'full');

    if (available === 0) {
        card.classList.add('full');
        status.textContent = 'Parking is full';
    } else if (percent <= 20) {
        card.classList.add('low');
        status.textContent = 'Almost full';
    } else {
        status.textContent = 'Slots available';
    }
}

function reserveSlot() {
    if (data.reserved >= TOTAL_STORAGE) return false;
    data.reserved++;
    data.history.push({ time: new Date().toISOString(), action: 'reserved' });
    saveData();
    renderSlots();
    return true;
}

function cancelReservation() {
    if (data.reserved <= 0) return false;
    data.reserved--;
    data.history.push({ time: new Date().toISOString(), action: 'cancelled' });
    saveData();
    renderSlots();
    return true;
}

renderSlots();
