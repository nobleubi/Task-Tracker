import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Tasks from "./components/Tasks";
import AddTask from "./components/AddTask";
import About from "./components/About";

const API_URL = https://task-tracker-backend-6bzc.onrender.com'; // Replace with your actual Render URL

const App = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const getTasks = async () => {
      const tasksFromServer = await fetchTasks();
      setTasks(tasksFromServer);
    };

    getTasks();
  }, []);

  useEffect(() => {
    Notification.requestPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task) => {
        if (task.reminder && task.reminderTime) {
          const reminderTime = new Date(task.reminderTime);

          if (
            reminderTime <= now &&
            !task.notified
          ) {
            if (Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: task.text,
                icon: '/favicon.ico',
              });

              // Play sound
              const audio = new Audio('/alert.mp3');
              audio.play();

              // Vibrate (if supported)
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }

              // Save to on-screen notification history
              setNotifications((prev) => [
                ...prev,
                `🔔 ${task.text} at ${new Date().toLocaleTimeString()}`
              ]);
            }

            // Prevent duplicate notification (only in memory)
            task.notified = true;
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  const fetchTasks = async () => {
    const res = await fetch(API_URL);
    return await res.json();
  };

  const fetchTask = async (id) => {
    const res = await fetch(`${API_URL}/${id}`);
    return await res.json();
  };

  const addTask = async (task) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(task)
    });

    const data = await res.json();
    setTasks([...tasks, data]);
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleReminder = async (id) => {
    const taskToToggle = await fetchTask(id);
    const updTask = { ...taskToToggle, reminder: !taskToToggle.reminder };

    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(updTask)
    });

    const data = await res.json();

    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, reminder: data.reminder } : task
      )
    );
  };

  return (
    <Router>
      <div className="container">
        <Header
          onAdd={() => setShowAddTask(!showAddTask)}
          showAdd={showAddTask}
        />
        <Routes>
          <Route
            path="/"
            element={
              <>
                {showAddTask && <AddTask onAdd={addTask} />}
                {tasks.length > 0 ? (
                  <Tasks
                    tasks={tasks}
                    onDelete={deleteTask}
                    onToggle={toggleReminder}
                  />
                ) : (
                  "No Tasks To Show"
                )}
              </>
            }
          />
          <Route path="/about" element={<About />} />
        </Routes>
        <Footer />

        {notifications.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h4>Notification History</h4>
            <ul>
              {notifications.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;