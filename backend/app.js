const express = require('express');
const cors = require('cors');
const pomodoroRouter = require('./routes/pomodoroRoutes');
const tasksRouter    = require('./routes/tasksRoutes');

const app = express();

// Enable CORS
app.use(cors());

app.use(express.json());



app.use('/api/pomodoro', pomodoroRouter);
/*
frontend example:
const response = await fetch("http://localhost:5000/api/pomodoro/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    login_time: new Date().toISOString()   // or omit body entirely
  })
});
*/



app.use('/api/tasks',    tasksRouter);



// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Pomodoro API running on port ${PORT}`));

module.exports = app;





// nodes for tasks
// AI chatbox checks whaht youre trying to accomplish at start, then  at end of day, (journal assistant)
// -- when first start, "whats up today"



