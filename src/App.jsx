import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Home,
  Lightbulb,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("");
  const [newImportance, setNewImportance] = useState("");
  const [activeTab, setActiveTab] = useState("activity");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (unlocked) {
      fetchTodos(activeTab);
      listRef.current?.scrollTo(0, 0);
      setShowForm(true);
    }
  }, [unlocked, activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const scrollTop = listRef.current.scrollTop;
        setShowForm(scrollTop < 30); // scroll ลงไป form ค่อย fade out
      }
    };

    const ref = listRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);

    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  async function fetchTodos(tab = activeTab) {
    let query = supabase.from("todos").select("*").order("id", { ascending: false });

    if (tab === "activity") query = query.eq("type", "กิจกรรม");
    else if (tab === "idea") query = query.eq("type", "project-idea");
    else if (tab === "learn") query = query.eq("type", "เรียน");
    else if (tab === "ทุน") query = query.eq("type", "ทุน");

    const { data, error } = await query;
    if (!error) setTodos(data);
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const { data, error } = await supabase
      .from("todos")
      .insert([
        { task: newTodo, done: false, due_at: newDate, type: newType, importance: newImportance },
      ])
      .select();
    if (!error) setTodos([data[0], ...todos]);
    setNewTodo("");
    setNewDate("");
    setNewType("");
    setNewImportance("");
  }

  async function toggleTodo(id, done) {
    const { error } = await supabase.from("todos").update({ done: !done }).eq("id", id);
    if (!error) setTodos(todos.map((t) => (t.id === id ? { ...t, done: !done } : t)));
  }

  async function deleteTodo(id) {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) setTodos(todos.filter((t) => t.id !== id));
  }

  const pendingTasks = todos.filter((t) => !t.done).length;

  const tabNameMap = {
    activity: "กิจกรรม",
    idea: "ไอเดีย",
    learn: "เรียน",
    ทุน: "ทุน",
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-emerald-500">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter PIN</h2>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none"
            placeholder="PIN"
          />
          <button
            onClick={() => {
              if (pin === "2548") setUnlocked(true);
              else alert("Incorrect PIN");
            }}
            className="mt-4 w-full bg-teal-500 text-white py-2 rounded-lg shadow hover:bg-teal-600 transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-teal-400 to-emerald-500 relative">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-4 mt-4">
        <h1 className="text-xl font-bold text-white">PK Todo</h1>
        <button
          onClick={() => setActiveTab("")}
          className="bg-white rounded-full p-2 shadow hover:scale-105 transition"
        >
          <Home className="text-gray-700" />
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center w-full max-w-md text-center bg-white py-3 shadow-md rounded-2xl mb-2">
        <div className="text-lg font-semibold text-black">
          พีเค มี {pendingTasks} งานต้องทำนะ!
        </div>
      </div>

      {activeTab === "home" ? (
        <div className="text-center flex-1 flex flex-col items-center justify-center w-full max-w-md">
          <div className="text-6xl font-bold text-black mb-2">{pendingTasks}</div>
          <p className="text-lg text-gray-700">Tasks left</p>
        </div>
      ) : (
        <>
          {/* Todo list */}
          <div
            ref={listRef}
            className="flex-1 w-full max-w-md space-y-4 overflow-y-auto pb-64 px-4 mt-2"
          >
            {todos.length === 0 ? (
              <p className="text-center text-gray-600 font-medium">
                {tabNameMap[activeTab]} ยังไม่มีข้อมูล
              </p>
            ) : (
              todos.map((todo) => {
                let borderColor = "";
                if (todo.importance === "มาก") borderColor = "border-l-4 border-red-500";
                else if (todo.importance === "กลาง") borderColor = "border-l-4 border-yellow-500";
                else if (todo.importance === "ต่ำ") borderColor = "border-l-4 border-green-500";

                const isOverdue = !todo.done && todo.due_at && new Date(todo.due_at) < new Date();

                return (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`bg-white rounded-2xl shadow-lg p-4 space-y-2 relative ${borderColor}`}
                  >
                    <div className="flex items-center space-x-3">
                      <button onClick={() => toggleTodo(todo.id, todo.done)}>
                        {todo.done ? (
                          <CheckCircle2 className="text-green-500" />
                        ) : (
                          <Circle className="text-gray-400" />
                        )}
                      </button>
                      <span
                        className={`font-medium ${
                          todo.done ? "line-through text-gray-400" : "text-black"
                        }`}
                      >
                        {todo.task}
                      </span>
                    </div>
                    <div className={`text-sm ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
                      Date: {todo.due_at ? new Date(todo.due_at).toLocaleString() : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Type: {todo.type || "N/A"}</div>
                    <div className="text-sm text-gray-600">
                      Importance: {todo.importance || "N/A"}
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="text-red-400" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Add todo form (fade in/out with scroll) */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                onSubmit={addTodo}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-16 w-full max-w-md bg-white rounded-2xl shadow-xl p-4 space-y-3 px-4"
              >
                <input
                  className="w-full px-4 py-2 text-black focus:outline-none border border-gray-300 rounded-lg"
                  placeholder="Add a new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 text-black focus:outline-none border border-gray-300 rounded-lg"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />

                <select
                  className="w-full px-4 py-2 text-black focus:outline-none border border-gray-300 rounded-lg"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="กิจกรรม">กิจกรรม</option>
                  <option value="project-idea">project-idea</option>
                  <option value="เรียน">เรียน</option>
                  <option value="ทุน">ทุน</option>
                </select>

                <select
                  className="w-full px-4 py-2 text-black focus:outline-none border border-gray-300 rounded-lg"
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value)}
                >
                  <option value="">Select Importance</option>
                  <option value="มาก">มาก</option>
                  <option value="กลาง">กลาง</option>
                  <option value="ต่ำ">ต่ำ</option>
                </select>

                <button className="w-full bg-teal-500 py-2 text-white rounded-lg flex items-center justify-center hover:bg-teal-600 transition">
                  <Plus className="mr-2 text-white" /> Add Task
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 w-full max-w-md bg-white flex justify-around py-2 rounded-t-2xl shadow-md">
        <button
          onClick={() => setActiveTab("activity")}
          className={`${activeTab === "activity" ? "text-teal-500" : "text-gray-400"}`}
        >
          <Briefcase />
        </button>
        <button
          onClick={() => setActiveTab("idea")}
          className={`${activeTab === "idea" ? "text-teal-500" : "text-gray-400"}`}
        >
          <Lightbulb />
        </button>
        <button
          onClick={() => setActiveTab("learn")}
          className={`${activeTab === "learn" ? "text-teal-500" : "text-gray-400"}`}
        >
          <BookOpen />
        </button>
        <button
          onClick={() => setActiveTab("ทุน")}
          className={`${activeTab === "ทุน" ? "text-teal-500" : "text-gray-400"}`}
        >
          <Home />
        </button>
      </div>
    </div>
  );
}
