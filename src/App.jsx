import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import Stars from "./Stars";

const API_URL = "https://ai-notes-bakcend.onrender.com";

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notes`);
        if (!res.ok) throw new Error("Failed to fetch notes");
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error(err);
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
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
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
      await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (id) => {
    setNotes(notes.filter(n => n.id !== id));
    try {
      await fetch(`${API_URL}/api/notes/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50 font-sans">
      
      <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-600">AI Notes ✨</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write or dictate your note..."
        className="w-full p-4 mb-4 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
        rows={5}
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma separated)"
        className="w-full p-3 mb-6 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={startListening}
          disabled={listening}
          className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition disabled:opacity-50"
        >
          🎤 Start Dictation
        </button>
        <button
          onClick={stopListening}
          disabled={!listening}
          className="px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition disabled:opacity-50"
        >
          ⏹ Stop & Insert
        </button>
        <button
          onClick={handleSummarize}
          className="px-5 py-2 bg-yellow-400 text-white rounded-lg shadow hover:bg-yellow-500 transition"
        >
          ✨ Summarize AI
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
        >
          💾 Save Note
        </button>
      </div>

      {listening && <p className="text-gray-600 mb-4 font-medium">🎙️ Listening...</p>}

      {summary && (
        <div className="p-4 mb-6 bg-blue-50 border-l-4 border-blue-400 rounded shadow-sm">
          <b>AI Summary:</b> {summary}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Saved Notes</h2>
      <ul className="space-y-4">
        {notes.map((n) => (
          <li key={n.id} className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <p className="text-gray-800">{n.text}</p>
            {n.summary && <p className="text-gray-600 mt-1"><b>Summary:</b> {n.summary}</p>}
            {n.tags.length > 0 && <p className="text-gray-500 mt-1"><b>Tags:</b> {n.tags.join(", ")}</p>}
            <button
              onClick={() => deleteNote(n.id)}
              className="mt-3 px-4 py-1 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
            >
              ❌ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
