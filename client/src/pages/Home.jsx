import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const validateName = () => {
    if (userName.trim() === '') {
      alert('Please enter your name first');
      return false;
    }
    return true;
  };

  const createRoom = () => {
    if (!validateName()) return;
    const newRoomId = generateRoomId();
    navigate(`/room/${newRoomId}`, { state: { userName } });
  };

  const joinRoom = () => {
    if (!validateName()) return;
    if (roomId.trim() === '') {
      alert('Please enter a room ID');
      return;
    }
    navigate(`/room/${roomId}`, { state: { userName } });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Collaborative Code Editor</h1>

      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </div>

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