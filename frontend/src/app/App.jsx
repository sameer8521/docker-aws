import "./App.css";
import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState, useMemo } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });

  const [users, setUsers] = useState([]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const ytext = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  //  Setup provider + awareness
  useEffect(() => {
    if (!username) return;

    const provider = new SocketIOProvider(
      "http://localhost:5000",
      "monaco",
      ydoc,
      { autoConnect: true }
    );

    providerRef.current = provider;

    provider.awareness.setLocalStateField("user", { username });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(
        states
          .filter((s) => s.user)
          .map((s) => s.user)
      );
    };

    updateUsers();
    provider.awareness.on("change", updateUsers);

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      provider.awareness.off("change", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      provider.disconnect();
    };
  }, [username, ydoc]);

  //  Editor mount
  const handleMount = (editor) => {
    editorRef.current = editor;

    if (!providerRef.current) return;

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      providerRef.current.awareness
    );
  };

  // Cleanup binding + doc
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      ydoc.destroy();
    };
  }, [ydoc]);

  const handleJoin = (e) => {
    e.preventDefault();
    const name = e.target.username.value;
    setUsername(name);
    window.history.pushState({}, "", "?username=" + name);
  };

  //  Join screen
  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center">
        <form onSubmit={handleJoin} className="bg-neutral-800 p-8 rounded-lg">
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded mb-4 w-full text-white bg-gray-700"
            name="username"
          />
          <button className="bg-amber-500 px-4 py-2 rounded text-black w-full">
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-2 text-white text-xl">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg">
        <h2 className="text-2xl font-bold p-4 border-b border-gray-300">
          Users
        </h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li
              key={index}
              className="p-2 bg-gray-800 text-white rounded mb-2"
            >
              {user.username}
            </li>
          ))}
        </ul>
      </aside>

      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding..."
          theme="vs-dark"
          onMount={handleMount}
          options={{ fontSize: 20 }}
        />
      </section>
    </main>
  );
}

export default App;