import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const generateRoomId = () => {
    // simple random room code generator
    return Math.random().toString(36).substring(2, 8);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim() === '') {
      alert('Please enter a room ID');
      return;
    }
    navigate(`/room/${roomId}`);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Collaborative Code Editor</h1>

      <div style={{ marginTop: '30px' }}>
        <button onClick={createRoom} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Create New Room
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
        />
        <button onClick={joinRoom} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Home;