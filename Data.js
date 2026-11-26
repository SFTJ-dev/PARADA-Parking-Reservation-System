// PARKING DATA
const zones = ['A', 'B', 'C', 'D'];
const slotsPerZone = 24; // sample number muna, not actual campus capacity
const totalSlots = zones.length * slotsPerZone;
const demoOccupied = ['A01','A04','A07','A08','A09','A11','A13','A16','A17','A21','A23','B02','B04','B06','B09','B14','B18','C01','C05','C11','C15','D03','D06','D10'];
let currentZone = 'A';
let selectedSlot = '';
let currentUser = null;
let data = { active: null, history: [] };
let occupiedSlots = [];
let isDemo = false;
let ready = false;
let busy = false;
let signingUp = false;
let notices = [];
let notificationsOn = true;
const get = id => document.getElementById(id);

//eto para kahit irefresh yung page, di nawawala yung inedit sa demo mode
function loadDemo() {
    try {
        const saved = JSON.parse(localStorage.getItem('paradaLocalStorage'));
        if (saved) return saved;
    } catch (err) { console.log(err); }
    return { active: null, history: [], name: 'Demo student' };
}

//eto para ma-save sa localStorage yung inedit sa demo mode
function saveDemo() {
    localStorage.setItem('paradaLocalStorage', JSON.stringify(data));
    occupiedSlots = demoOccupied.slice();
    if (data.active) occupiedSlots.push(data.active.slot);
    renderAll();
}


function message(id, text, success = false) {
    get(id).textContent = text;
    get(id).classList.toggle('success', success);
}
function safe(text) {
    const span = document.createElement('span');
    span.textContent = text == null ? '' : String(text);
    return span.innerHTML;
}
function formatDate(value) {
    return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}
function slotId(zone, number) {
    return zone + String(number).padStart(2, '0');
}
function zoneFree(zone) {
    return slotsPerZone - occupiedSlots.filter(slot => slot.startsWith(zone)).length;
}

// NAVIGATION
const navItems = document.querySelectorAll('.navAct');
function showPage() {
    let page = location.hash.slice(1);
    if (page === 'home') page = 'dashboard';
    if (!['dashboard','campus','ticket','history','settings'].includes(page)) page = 'dashboard';
    document.querySelectorAll('.page').forEach(section => section.hidden = section.id !== page);
    navItems.forEach(item => {
        const active = item.dataset.target === page;
        item.classList.toggle('activeNav', active);
        if (active) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });
    get('notifPanel').hidden = true;
    get('notifBtn').setAttribute('aria-expanded', 'false');
}
window.addEventListener('hashchange', showPage);
get('profileBtn').addEventListener('click', () => location.hash = 'settings');

// DASHBOARD
function renderSlots() {
    if (selectedSlot && occupiedSlots.includes(selectedSlot)) selectedSlot = '';
    get('zoneTabs').innerHTML = '';
    zones.forEach(zone => {
        const btn = document.createElement('button');
        btn.className = 'zoneBtn' + (zone === currentZone ? ' activeZone' : '');
        btn.textContent = 'Zone ' + zone;
        btn.setAttribute('aria-pressed', zone === currentZone);
        btn.onclick = () => { currentZone = zone; selectedSlot = ''; renderSlots(); };
        get('zoneTabs').appendChild(btn);
    });
    get('zoneName').textContent = 'Zone ' + currentZone;
    get('zoneAvailability').textContent = zoneFree(currentZone) + ' of ' + slotsPerZone + ' available';
    get('parkingRows').innerHTML = '';
    for (let row = 0; row < 3; row++) {
        const parkingRow = document.createElement('div');
        parkingRow.className = 'parkingRow';
        for (let col = 1; col <= 8; col++) {
            const id = slotId(currentZone, row * 8 + col);
            const occupied = occupiedSlots.includes(id);
            const btn = document.createElement('button');
            btn.className = 'parkingSlot' + (occupied ? ' occupied' : '') + (selectedSlot === id ? ' selected' : '');
            btn.disabled = occupied || !!data.active || !ready;
            btn.setAttribute('aria-label', id + (occupied ? ' occupied' : ' available'));
            btn.setAttribute('aria-pressed', selectedSlot === id);
            if (occupied) btn.innerHTML = '<img src="img/car.svg" alt=""><small>' + id + '</small>';
            else btn.textContent = id;
            btn.onclick = () => { selectedSlot = id; renderSlots(); };
            parkingRow.appendChild(btn);
        }
        get('parkingRows').appendChild(parkingRow);
        if (row < 2) {
            const road = document.createElement('div');
            road.className = 'road'; road.textContent = 'DRIVEWAY';
            get('parkingRows').appendChild(road);
        }
    }
    const available = totalSlots - occupiedSlots.length;
    get('slotAvailable').textContent = available;
    get('slotTotal').textContent = totalSlots;
    get('availableCount').textContent = available;
    get('occupiedCount').textContent = occupiedSlots.length;
    get('slotBarFill').innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const bar = document.createElement('span');
        // TODO JS-1: Calculate how many of the 24 bars should be filled.
        // Add the 'filled' class only to bars that represent available spaces.
        get('slotBarFill').appendChild(bar);
    }
    get('slotBarFill').setAttribute('aria-label', available + ' available spaces');
    get('selectedSlot').textContent = selectedSlot || 'Select a slot';
    get('bookBtn').disabled = !selectedSlot || !!data.active || !ready || busy;
    get('bookingHint').textContent = !ready ? 'Loading parking data...' : data.active ? 'You already have an active ticket.' : 'Choose a free slot on the parking map.';
}
// TODO CAMPUS: Build the campus page, then render zone counts here.
function renderCampus() {
    // Try looping through zones and using zoneFree(zone).
}

// RESERVATION
get('bookingForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !ready || !selectedSlot || data.active) return;
    const plate = get('plate').value.trim().toUpperCase();
    if (!/^[A-Z0-9 -]{2,12}$/.test(plate)) { message('appMessage', 'Enter a valid plate number.'); return; }
    const now = new Date();
    const end = new Date(now);
    const parts = get('exitTime').value.split(':');
    end.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    if (!Number.isFinite(end.getTime()) || end <= now) { message('appMessage', 'Choose an exit time later today.'); return; }
    const ticket = { id: 'P-' + Date.now().toString(36).toUpperCase(), slot: selectedSlot, plate, vehicle: get('vehicle').value, start: now.toISOString(), end: end.toISOString() };
    busy = true; renderSlots();
    try {
        if (isDemo) {
            if (occupiedSlots.includes(ticket.slot)) throw new Error('That space is already occupied.');
            data.active = ticket; saveDemo();
        } else await window.paradaFirebase.reserve(ticket);
        selectedSlot = ''; get('bookingForm').reset(); setDefaultTime();
        addNotice('Reservation confirmed for ' + ticket.slot + '.');
        message('appMessage', 'Parking reserved successfully.', true);
        location.hash = 'ticket';
    } catch (err) { message('appMessage', err.message || 'Unable to reserve parking.'); }
    finally { busy = false; renderAll(); }
});
async function finishReservation(status) {
    if (busy || !ready || !data.active) return;
    if (!confirm(status === 'Cancelled' ? 'Cancel this reservation?' : 'End your parking session and release the space?')) return;
    const ticket = data.active;
    busy = true; renderAll();
    try {
        if (isDemo) {
            data.history.unshift({ ...ticket, status, closed: new Date().toISOString() });
            data.active = null; saveDemo();
        } else await window.paradaFirebase.finish(ticket, status);
        addNotice('Reservation ' + status.toLowerCase() + ' for ' + ticket.slot + '.');
        message('appMessage', 'Parking space released.', true);
        location.hash = 'history';
    } catch (err) { message('appMessage', err.message || 'Unable to release parking.'); }
    finally { busy = false; renderAll(); }
}
function renderTicket() {
    const ticket = data.active;
    get('currentTitle').textContent = ticket ? 'Parking space ' + ticket.slot : 'No active ticket';
    get('currentDetail').textContent = ticket ? ticket.plate : 'Your parking details will appear here.';
    get('ticketContent').textContent = ticket ? 'Reserved space: ' + ticket.slot : 'No active ticket.';
    // TODO TICKET: Show plate, ID, vehicle, start/end time and wire up buttons
    // to finishReservation('Completed') and finishReservation('Cancelled').
}
function renderHistory() {
    // TODO HISTORY: Create a table and display data.history.
}
function renderAll() { renderSlots(); renderCampus(); renderTicket(); renderHistory(); }

// NOTIFICATIONS AND SETTINGS
function addNotice(text) {
    notices.unshift(text); notices = notices.slice(0, 8);
    get('notifDot').hidden = !notificationsOn;
    renderNotices();
}
function renderNotices() {
    get('notifList').innerHTML = !notificationsOn ? '<p class="muted">Notifications are turned off.</p>' : notices.length ? notices.map(text => '<div class="notice">' + safe(text) + '</div>').join('') : '<p class="muted">No new notifications.</p>';
}
get('notifBtn').onclick = () => {
    // TODO NOTIFICATIONS: Toggle the panel, set aria-expanded and clear the dot.
};
function renderProfile() {
    const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Student';
    get('headerName').textContent = name;
    get('headerRole').textContent = isDemo ? 'Demo user' : 'Parking user';
    get('avatar').textContent = name[0].toUpperCase();
    get('greeting').textContent = 'Welcome, ' + name + '!';
    // TODO SETTINGS: Display account information and implement preferences.
}
function setDefaultTime() {
    const end = new Date(Date.now() + 60 * 60 * 1000);
    if (end.getDate() !== new Date().getDate()) { get('exitTime').value = '23:59'; return; }
    get('exitTime').value = String(end.getHours()).padStart(2,'0') + ':' + String(end.getMinutes()).padStart(2,'0');
}

// LOGIN / SIGN UP
function showAuth() {
    ready = false; isDemo = false; currentUser = null; data = { active: null, history: [] }; occupiedSlots = []; selectedSlot = ''; notices = [];
    get('app').hidden = true; get('authPage').hidden = false;
    get('authForm').reset(); message('appMessage', '');
}
function showApp(user, demo = false) {
    currentUser = user; isDemo = demo; ready = demo; selectedSlot = ''; currentZone = 'A'; notices = [];
    data = demo ? loadDemo() : { active: null, history: [] };
    occupiedSlots = demo ? demoOccupied.concat(data.active ? [data.active.slot] : []) : [];
    notificationsOn = localStorage.getItem('paradaNotices-' + user.uid) !== 'false';
    get('notifDot').hidden = true; get('notifPanel').hidden = true;
    get('authPage').hidden = true; get('app').hidden = false; get('demoBanner').hidden = !demo;
    get('liveLabel').textContent = demo ? 'Demo data' : 'Connecting…';
    get('todayDate').textContent = new Date().toLocaleDateString('en-PH', { weekday:'short', month:'long', day:'numeric', year:'numeric' });
    setDefaultTime(); renderProfile(); renderAll(); renderNotices(); showPage();
}
get('toggleAuth').onclick = () => {
    signingUp = !signingUp;
    get('nameField').hidden = !signingUp; get('authName').required = signingUp;
    get('resetPassword').hidden = signingUp;
    get('authPassword').autocomplete = signingUp ? 'new-password' : 'current-password';
    get('authTitle').textContent = signingUp ? 'Create your account' : 'Log in to your account';
    get('authSubtitle').textContent = signingUp ? 'Sign up to start reserving parking.' : 'Enter your details to continue.';
    get('authSubmit').textContent = signingUp ? 'Sign up' : 'Log in';
    get('authPrompt').textContent = signingUp ? 'Already have an account?' : "Don't have an account?";
    get('toggleAuth').textContent = signingUp ? 'Log in' : 'Sign up'; message('authMessage', '');
};
function firebaseReady() {
    if (!window.paradaFirebase) { message('authMessage', 'Firebase is not connected yet. See README or explore demo mode.'); return false; }
    return true;
}
get('authForm').onsubmit = async event => {
    event.preventDefault(); if (!firebaseReady()) return;
    get('authSubmit').disabled = true;
    try {
        await window.paradaFirebase.emailLogin(get('authEmail').value.trim(), get('authPassword').value, signingUp, get('authName').value.trim());
        message('authMessage', '');
    } catch (err) { message('authMessage', err.message); }
    finally { get('authSubmit').disabled = false; }
};
get('googleBtn').onclick = async () => {
    if (!firebaseReady()) return;
    get('googleBtn').disabled = true;
    try { await window.paradaFirebase.googleLogin(); message('authMessage', ''); }
    catch (err) { message('authMessage', err.message); }
    finally { get('googleBtn').disabled = false; }
};
get('resetPassword').onclick = async () => {
    if (!firebaseReady()) return;
    const email = get('authEmail');
    if (!email.value || !email.checkValidity()) { message('authMessage', 'Enter your email address first.'); return; }
    try { await window.paradaFirebase.reset(email.value.trim()); message('authMessage', 'Password reset email sent if the account exists.', true); }
    catch (err) { message('authMessage', err.message); }
};
get('demoBtn').onclick = () => {
    if (window.paradaFirebase?.authPending) return;
    const saved = loadDemo();
    location.hash = 'dashboard'; showApp({ uid: 'demo', displayName: saved.name || 'Demo student', email: 'demo@example.com' }, true);
};
async function logout() {
    if (isDemo) showAuth();
    else if (firebaseReady()) {
        try { await window.paradaFirebase.logout(); } catch (err) { message('appMessage', err.message); }
    }
}
get('logoutBtn').onclick = logout; get('exitDemo').onclick = logout;

// Firebase.js calls these when user or parking data changes.
window.paradaUI = {
    signedIn(user) { showApp(user); },
    signedOut() { if (!isDemo) showAuth(); },
    profileChanged(user) { if (!isDemo && currentUser) { currentUser = user; renderProfile(); } },
    sync(slots, userData, connected) {
        if (isDemo || !currentUser) return;
        occupiedSlots = slots; data = userData; ready = connected;
        get('liveLabel').textContent = connected ? 'Live parking' : 'Connecting…';
        renderAll();
    },
    error(text) { ready = false; get('liveLabel').textContent = 'Not connected'; message('appMessage', text); renderSlots(); }
};
