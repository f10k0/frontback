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
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true
});

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('Новая задача:', task);
        io.emit('taskAdded', task);
        const payload = JSON.stringify({
            title: 'Новая заметка',
            body: task.text
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push ошибка:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
    }
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    const protocol = server instanceof https.Server ? 'https' : 'http';
    console.log(`Сервер запущен на ${protocol}://localhost:${PORT}`);
});