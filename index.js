const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const PORT = process.env.PORT || 5000;

const { addUser, removeUser, getUser, getUserInRoom } = require('./users.js');
const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining a room
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        // Welcome the user
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room: ${user.room}` });

        // Notify others
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined the room.` });

        // Update room user list
        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) });

        callback();
    });

    // Handle message sending
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: user.name, text: message });

            // Keep the room data updated if needed
            io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) });

            callback(); // acknowledge success
        } else {
            console.error('User not found for socket ID:', socket.id);
            callback('User not found');
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) });
        }

        console.log('Client disconnected:', socket.id, user?.name || 'Unknown');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
