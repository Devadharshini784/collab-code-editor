const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // we'll lock this down later for production
    methods: ['GET', 'POST']
  }
});

// Keep track of which room has which code (in-memory for now, no DB yet)
const roomCodeMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a user joins a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    // If this room already has code, send it to the new user immediately
    if (roomCodeMap[roomId]) {
      socket.emit('load-code', roomCodeMap[roomId]);
    }
  });

  // When a user types code
  socket.on('code-change', ({ roomId, code }) => {
    roomCodeMap[roomId] = code; // save latest code for the room
    socket.to(roomId).emit('code-update', code); // send to everyone else in room, NOT back to sender
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});