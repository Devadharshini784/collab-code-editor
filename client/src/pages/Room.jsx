import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { socket } from '../socket';

function Room() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Start coding together...\n');
  const isRemoteChange = useRef(false); // prevents feedback loop when we receive an update

  useEffect(() => {
    socket.connect();
    socket.emit('join-room', roomId);

    // When the server sends existing code for this room
    socket.on('load-code', (loadedCode) => {
      isRemoteChange.current = true;
      setCode(loadedCode);
    });

    // When another user in the room makes a change
    socket.on('code-update', (updatedCode) => {
      isRemoteChange.current = true;
      setCode(updatedCode);
    });

    // Cleanup when leaving the page
    return () => {
      socket.off('load-code');
      socket.off('code-update');
      socket.disconnect();
    };
  }, [roomId]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      // this change came from the server, not the user — don't re-broadcast it
      isRemoteChange.current = false;
      return;
    }
    setCode(value);
    socket.emit('code-change', { roomId, code: value });
  };

  return (
    <div>
      <div style={{ padding: '10px', background: '#1e1e1e', color: 'white' }}>
        <strong>Room ID:</strong> {roomId}
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>
          (share this link to collaborate)
        </span>
      </div>
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
      />
    </div>
  );
}

export default Room;