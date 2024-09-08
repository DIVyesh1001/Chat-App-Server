const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT||5000;
const cors = require('cors');

const { addUser, removeUser, getUser, getUserInRoom } = require('./users.js')

const router = require('./router');
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});
app.use(router);
app.use(cors());

io.on('connection', (socket) => {
    // console.log('New Client connected');

    socket.on('join', ({ name, room }, callback) => {
        console.log(`${name} has joined the room ${room}`);
        const { error, user } = addUser({ id: socket.id, name: name, room: room });
        if (error) {
            return callback(error);
        }

        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room : ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} joined the room ${user.room}` })

        socket.join(user.room);

        // io.to(user.room).emit('roomData',{room:user.room,users:getUserInRoom(user.room)});


        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const u = getUser(socket.id);

        if (u) {
            console.log('\n',u.room,u.name,'\n');
            io.to(u.room).emit('message', { user: u.name, text: message });
            // io.to(u.room).emit('roomData', { room: u.room, users:getUserInRoom(user.room) });
            callback();  // Acknowledge the message was sent successfully
        } else {
            // Optionally handle the case where the user is not found
            console.error('User not found for socket ID:', socket.id);
            callback('User not found');
        }
    });


    socket.on('disconnect', () => {
        console.log("Client disconnected:");
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left the room`}) 
        }
    });
})


server.listen(PORT, () => {
    console.log(`Server is Running on PORT ${PORT}`);
})
