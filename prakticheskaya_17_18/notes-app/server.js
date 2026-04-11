const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

const vapidKeys = {
    publicKey: 'BPsK_NvQivnuUVIc1mlh5mx8gJo4A2nwlCYSoyFnX8_56ls7b11AsTCpkslgMKnlRrHvkUay4IFJjKSY5NsE-ts',
    privateKey: 'XNNJaJ5UXDMI0yOBhzf8ix34-Fa5sQNQ_xurJf83_4w'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

let subscriptions = [];
const reminders = new Map();

let server;
try {
    const options = {
        key: fs.readFileSync('localhost+2-key.pem'),
        cert: fs.readFileSync('localhost+2.pem')
    };
    server = https.createServer(options, app);
    console.log('HTTPS сервер запущен с сертификатами');
} catch (err) {
    console.error('Ошибка загрузки сертификатов:', err.message);
    console.log('Запуск HTTP сервера вместо HTTPS...');
    const http = require('http');
    server = http.createServer(app);
}

const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    allowEIO3: true
});

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('Новая задача:', task);
        io.emit('taskAdded', task);
        const payload = JSON.stringify({ title: 'Новая заметка', body: task.text });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push ошибка:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
    });

    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        if (delay <= 0) return;

        const timeoutId = setTimeout(() => {
            // Проверяем, не было ли уже отложено это напоминание
            if (!reminders.has(id)) return;
            
            const reminderData = reminders.get(id);
            const payload = JSON.stringify({
                title: 'Напоминание',
                body: reminderData.text,
                reminderId: id
            });
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
            });
        }, delay);

        reminders.set(id, { timeoutId, text, reminderTime, isActive: true });
        console.log(`Напоминание ${id} запланировано через ${Math.round(delay/1000)} секунд`);
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) subscriptions.push(subscription);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    console.log(`[SERVER] Получен snooze для reminderId: ${reminderId}`);
    console.log(`[SERVER] Текущие напоминания:`, Array.from(reminders.keys()));
    
    if (!reminderId || !reminders.has(reminderId)) {
        console.log(`[SERVER] Напоминание ${reminderId} не найдено`);
        return res.status(400).json({ error: 'Reminder not found' });
    }
    
    const reminder = reminders.get(reminderId);

    if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
    }
    
    const newDelay = 60 * 1000; // 1 минута
    const newTimeoutId = setTimeout(() => {
        if (!reminders.has(reminderId)) return;
        
        const reminderData = reminders.get(reminderId);
        const payload = JSON.stringify({
            title: 'Напоминание (отложено)',
            body: reminderData.text,
            reminderId: reminderId
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
        reminders.delete(reminderId);
    }, newDelay);
    
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay,
        isActive: true
    });
    
    console.log(`Напоминание ${reminderId} отложено на 1 минуту`);
    res.status(200).json({ message: 'Reminder snoozed for 1 minute' });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    const protocol = server instanceof https.Server ? 'https' : 'http';
    console.log(`Сервер запущен на ${protocol}://localhost:${PORT}`);
});