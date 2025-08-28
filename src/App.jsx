import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

// Use env variable or fallback
const API_URL = process.env.REACT_APP_API_URL || "https://ai-notes-bakcend.onrender.com";

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // Load notes from backend on mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notes`);
        if (!res.ok) throw new Error("Failed to fetch notes");
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, []);

  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) setText(prev => (prev ? prev + " " : "") + transcript);
    resetTranscript();
  };

  const handleSummarize = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const html = await res.text();
        console.error("Backend returned non-JSON:", html);
        return;
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Summarization failed:", err);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;

    const newNote = {
      id: Date.now(),
      text,
      summary,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    setNotes([...notes, newNote]);
    setText("");
    setSummary("");
    setTags("");

    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (!res.ok) throw new Error("Failed to save note to backend");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (id) => {
    setNotes(notes.filter(n => n.id !== id));
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note on backend");
    } catch (err) {
      console.error(err);
    }
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
