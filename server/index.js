const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomCodeMap = {};   // { roomId: code }
const roomUsersMap = {};  // { roomId: { socketId: { name, color } } }

const COLORS = ['#FF5733', '#33A1FF', '#33FF57', '#F033FF', '#FFD133', '#33FFF6'];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;

    if (!roomUsersMap[roomId]) {
      roomUsersMap[roomId] = {};
    }

    const userInfo = {
      name: userName || `User-${socket.id.slice(0, 4)}`,
      color: getRandomColor()
    };
    roomUsersMap[roomId][socket.id] = userInfo;

    // Send existing code to the new user
    if (roomCodeMap[roomId]) {
      socket.emit('load-code', roomCodeMap[roomId]);
    }

    // Send the full user list to everyone in the room (including the new user)
    io.to(roomId).emit('user-list', roomUsersMap[roomId]);
  });

  socket.on('code-change', ({ roomId, code }) => {
    roomCodeMap[roomId] = code;
    socket.to(roomId).emit('code-update', code);
  });

  // New: cursor position broadcasting
  socket.on('cursor-move', ({ roomId, position }) => {
    const userInfo = roomUsersMap[roomId]?.[socket.id];
    if (!userInfo) return;

    socket.to(roomId).emit('cursor-update', {
      socketId: socket.id,
      position,
      name: userInfo.name,
      color: userInfo.color
    });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && roomUsersMap[roomId]) {
      delete roomUsersMap[roomId][socket.id];
      io.to(roomId).emit('user-list', roomUsersMap[roomId]);

      // let others know this user's cursor should be removed
      socket.to(roomId).emit('user-left', socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});