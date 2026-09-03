import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { socket } from '../socket';

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const userName = location.state?.userName || `Guest-${Math.floor(Math.random() * 1000)}`;

  const [code, setCode] = useState('// Start coding together...\n');
  const [users, setUsers] = useState({});
  const isRemoteChange = useRef(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef({}); // { socketId: [decorationIds] }
  const remoteCursorsRef = useRef({}); // { socketId: { position, name, color } }

  useEffect(() => {
    socket.connect();
    socket.emit('join-room', { roomId, userName });

    socket.on('load-code', (loadedCode) => {
      isRemoteChange.current = true;
      setCode(loadedCode);
    });

    socket.on('code-update', (updatedCode) => {
      isRemoteChange.current = true;
      setCode(updatedCode);
    });

    socket.on('user-list', (userMap) => {
      setUsers(userMap);
    });

    socket.on('cursor-update', ({ socketId, position, name, color }) => {
      remoteCursorsRef.current[socketId] = { position, name, color };
      renderCursor(socketId);
    });

    socket.on('user-left', (socketId) => {
      // remove that user's cursor decoration
      if (editorRef.current && decorationsRef.current[socketId]) {
        editorRef.current.deltaDecorations(decorationsRef.current[socketId], []);
        delete decorationsRef.current[socketId];
      }
      delete remoteCursorsRef.current[socketId];
    });

    return () => {
      socket.off('load-code');
      socket.off('code-update');
      socket.off('user-list');
      socket.off('cursor-update');
      socket.off('user-left');
      socket.disconnect();
    };
  }, [roomId]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setCode(value);
    socket.emit('code-change', { roomId, code: value });
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Every time the local user moves their cursor, broadcast the position
    editor.onDidChangeCursorPosition((e) => {
      socket.emit('cursor-move', {
        roomId,
        position: {
          lineNumber: e.position.lineNumber,
          column: e.position.column
        }
      });
    });
  };

  // Renders (or updates) a single remote user's cursor as a decoration
  const renderCursor = (socketId) => {
    if (!editorRef.current || !monacoRef.current) return;

    const cursorInfo = remoteCursorsRef.current[socketId];
    if (!cursorInfo) return;

    const { position, name, color } = cursorInfo;
    const monaco = monacoRef.current;

    const newDecorations = [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + 1
        ),
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-flag',
          hoverMessage: { value: name },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      }
    ];

    const oldDecorations = decorationsRef.current[socketId] || [];
    decorationsRef.current[socketId] = editorRef.current.deltaDecorations(oldDecorations, newDecorations);
  };

  return (
    <div>
      <div style={{ padding: '10px', background: '#1e1e1e', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong>Room ID:</strong> {roomId}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.values(users).map((user, idx) => (
            <span
              key={idx}
              style={{
                background: user.color,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#111'
              }}
            >
              {user.name}
            </span>
          ))}
        </div>
      </div>
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme="vs-dark"
      />
    </div>
  );
}

export default Room;