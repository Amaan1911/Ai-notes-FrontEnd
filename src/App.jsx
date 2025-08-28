import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // 🔹 Load notes from localStorage on startup
  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    setNotes(savedNotes);
  }, []);

  // 🔹 Keep localStorage in sync whenever notes change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setText(prev => prev + " " + transcript);
    resetTranscript();
  };

  const handleSummarize = async () => {
    const res = await fetch("http://localhost:5000/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setSummary(data.summary);
  };

  const handleSave = async () => {
    // create note object
    const newNote = {
      id: Date.now(), // local unique id
      text,
      summary,
      tags: tags.split(",").map(t => t.trim())
    };

    setNotes([...notes, newNote]); // updates state
    setText("");
    setSummary("");
    setTags("");

    // 🔹 still call backend if you want
    await fetch("http://localhost:5000/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNote),
    });
  };

  const deleteNote = async (id) => {
    setNotes(notes.filter(n => n.id !== id));

    // 🔹 sync backend too
    await fetch(`http://localhost:5000/api/notes/${id}`, { method: "DELETE" });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">🎤 AI Notes App</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write or dictate your note..."
        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
        rows={5}
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma separated)"
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
      />

      <div className="flex gap-3 flex-wrap mb-6">
        <button onClick={startListening} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">🎤 Start Dictation</button>
        <button onClick={stopListening} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">⏹ Stop & Insert</button>
        <button onClick={handleSummarize} className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500 transition">✨ Summarize AI</button>
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">💾 Save Note</button>
      </div>

      {listening && <p className="text-red-500 font-semibold mb-4">🎙️ Listening...</p>}

      {summary && (
        <div className="p-3 mb-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
          <b>AI Summary Preview:</b> {summary}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Saved Notes</h2>
      <ul className="space-y-4">
        {notes.map(n => (
          <li key={n.id} className="p-4 bg-white shadow rounded-md">
            <p className="text-gray-800">{n.text}</p>
            <p className="text-gray-600 mt-1"><b>Summary:</b> {n.summary}</p>
            <p className="text-gray-500 mt-1"><b>Tags:</b> {n.tags.join(", ")}</p>
            <button onClick={() => deleteNote(n.id)} className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">❌ Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
