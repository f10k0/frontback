const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const statusDiv = document.getElementById('connection-status');
const enablePushBtn = document.getElementById('enable-push');
const disablePushBtn = document.getElementById('disable-push');

const socket = io('https://localhost:3001', {
    transports: ['websocket', 'polling']
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const VAPID_PUBLIC_KEY = 'BPsK_NvQivnuUVIc1mlh5mx8gJo4A2nwlCYSoyFnX8_56ls7b11AsTCpkslgMKnlRrHvkUay4IFJjKSY5NsE-ts';

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (response.ok) {
            console.log('Подписка на push отправлена');
            return true;
        }
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
    return false;
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch('/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('Отписка выполнена');
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
}

function updateConnectionStatus() {
    if (navigator.onLine) {
        statusDiv.className = 'status online';
        statusDiv.innerHTML = 'Онлайн режим';
    } else {
        statusDiv.className = 'status offline';
        statusDiv.innerHTML = 'Офлайн режим (заметки сохраняются локально)';
    }
}

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;
        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = '<p class="is-center text-error">Ошибка загрузки страницы.</p>';
        console.error(err);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('notes-list');
    if (!list) return;
    if (notes.length === 0) {
        list.innerHTML = '<li class="empty-message">Нет заметок. Добавьте первую!</li>';
        return;
    }
    list.innerHTML = notes.map(note => {
        let reminderInfo = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderInfo = `<br><small style="color: #4285f4;">Напоминание: ${date.toLocaleString()}</small>`;
        }
        return `
            <li style="background-color: white; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <span>${escapeHtml(note.text)}</span>
                    ${reminderInfo}
                </div>
                <button class="delete-btn" data-id="${note.id}" style="background-color: #dc3545; color: white; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer;">Удалить</button>
            </li>
        `;
    }).join('');
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteNoteById(id);
        });
    });
}

function deleteNoteById(id) {
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = { id: Date.now(), text: text, reminder: null };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    socket.emit('newTask', { id: newNote.id, text: text });
}

function addReminder(text, reminderTimestamp) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = { id: Date.now(), text: text, reminder: reminderTimestamp };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    socket.emit('newReminder', {
        id: newNote.id,
        text: text,
        reminderTime: reminderTimestamp
    });
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                addNote(text);
                input.value = '';
                input.focus();
            }
        });
    }
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = reminderText.value.trim();
            const timeStr = reminderTime.value;
            if (text && timeStr) {
                const timestamp = new Date(timeStr).getTime();
                if (timestamp > Date.now()) {
                    addReminder(text, timestamp);
                    reminderText.value = '';
                    reminderTime.value = '';
                } else {
                    alert('Дата и время должны быть в будущем');
                }
            } else {
                alert('Заполните оба поля');
            }
        });
    }
    loadNotes();
}

socket.on('taskAdded', (task) => {
    console.log('Задача от другого клиента:', task);
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = `Новая заметка: ${task.text}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    loadNotes();
});

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});
aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
loadContent('home');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker зарегистрирован');
            if (enablePushBtn && disablePushBtn) {
                const subscription = await reg.pushManager.getSubscription();
                if (subscription) {
                    enablePushBtn.style.display = 'none';
                    disablePushBtn.style.display = 'inline-block';
                }
                enablePushBtn.onclick = async () => {
                    if (Notification.permission === 'denied') {
                        alert('Уведомления запрещены. Разрешите их в настройках браузера.');
                        return;
                    }
                    if (Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                            alert('Необходимо разрешить уведомления.');
                            return;
                        }
                    }
                    const success = await subscribeToPush();
                    if (success) {
                        enablePushBtn.style.display = 'none';
                        disablePushBtn.style.display = 'inline-block';
                    }
                };
                disablePushBtn.onclick = async () => {
                    await unsubscribeFromPush();
                    disablePushBtn.style.display = 'none';
                    enablePushBtn.style.display = 'inline-block';
                };
            }
        } catch (err) {
            console.log('Ошибка регистрации Service Worker:', err);
        }
    });
}