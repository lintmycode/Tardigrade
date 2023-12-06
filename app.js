let time = 0
let laps = []
let lapTitle = ""
let tasks = []
let currentTask = 0
let isRunning = null

const dom = {
  time: document.querySelector(".time"),
  tasks: {
    list: document.querySelector(".tasks ul"),
    new: document.querySelector(".tasks .new-task"),
    delete: document.querySelector(".laps .delete"),
  },
  laps : {
    title: {
      label: document.querySelector(".laps h2"),
      input: document.querySelector(".laps .task-title"),
    },
    list: document.querySelector(".laps ul"),
    total: document.querySelector(".laps .total"),
  },
  stopwatch: {
    toggle: document.querySelector(".stopwatch-toggle"),
  }
}

const start = () => setInterval(() => renderTime(++time), 1000) 
const stop = () => clearInterval(isRunning) // returns void so its cool

// toggle start/stop states
// a) invert isRunning
// b) change button content
// c) disable edit controls
const stopwatch = () => {
  isRunning = isRunning ? stop() : start()
  document.body.classList.toggle("running", isRunning)
  dom.stopwatch.toggle.textContent = isRunning ? dom.stopwatch.toggle.dataset.pause : dom.stopwatch.toggle.dataset.start
  disableEvents(isRunning)

  // when stopped, save new lap and re-render
  if (!isRunning) {
    laps = [...laps, {time: time, title: lapTitle}]
    tasks[currentTask].laps = laps
    save()
    renderLaps()
  }
}

// tasks
// new task should be made current and time reset to 0
const newTask = () => {
  if (isRunning) return
  tasks.push({ name: "", laps: [] })
  setCurrentTask(tasks.length - 1)
  renderTime(time = 0)
  editTaskTitle()
}

// delete a task
// note: cant delete if clock is running
const deleteTask = () => {
  if (isRunning) return
  tasks.splice(currentTask, 1)
  setCurrentTask(--currentTask)
  save()
}

// setting a current task should 
// a) load its laps
// b) re-render laps and tasks
const setCurrentTask = index => {
  if (isRunning) return
  currentTask = index
  laps = tasks[currentTask].laps
  renderLaps()
  renderTasks()
}

// enter edition mode on task title
const editTaskTitle = e => {
  dom.laps.title.label.classList.add("hidden")
  dom.laps.title.input.classList.remove("hidden")
  dom.laps.title.input.focus()
}

// edit a task title and leave edition
const setTaskTitle = e => {
  tasks[currentTask].name = e.target.value.trim().length !== 0 ? e.target.value.trim() : "new task"
  save()
  renderTasks()
}

// laps
// set current lap title
const setLapTitle = e => {
  lapTitle = "- " + e.target.value
  e.target.blur()
} 

// delete a lap, save and re-render
const deleteLap = index => {
  if (isRunning) return
  
  // if the last lap was deleted, update the timer
  if (index === laps.length - 1) {
    renderTime(time = laps.length > 1 ? laps[laps.length - 2].time : 0)
  }

  laps.splice(index, 1)
  tasks[currentTask].laps = laps
  renderLaps()
  save()  
}


// localstorage
const save = () => localStorage.setItem("tasks", JSON.stringify(tasks))
const load = () => [...JSON.parse(localStorage.getItem('tasks')) || 
  [{ name: "Untitled", laps: [] }]]

// format & rendering
const formatTime = (t, fuzzy = false) => {
  const hours = Math.floor(t / 3600);
  const minutes = Math.floor((t % 3600) / 60);
  const seconds = t % 60;

  if (fuzzy) {
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes} m` : ''}`;
    } else if (minutes > 0) {
      return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
    } else {
      return `${seconds}s`;
    }
  } else {
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }
}

// disable actions while clock is running
const disableEvents = (disable) => {
  if (disable) {
    dom.tasks.list.querySelectorAll("li button").forEach(e => e.setAttribute("disabled", "disabled"))
    dom.laps.list.querySelectorAll("li button").forEach(e => e.setAttribute("disabled", "disabled"))
    dom.tasks.new.setAttribute("disabled", "disabled")
    dom.tasks.delete.setAttribute("disabled", "disabled")
  } else {
    dom.tasks.list.querySelectorAll("li button").forEach(e => e.removeAttribute("disabled"))
    dom.laps.list.querySelectorAll("li button").forEach(e => e.removeAttribute("disabled"))
    dom.tasks.new.removeAttribute("disabled")
    dom.tasks.delete.removeAttribute("disabled")
  }
}

// render task list
const renderTasks = () => {
  // reset task edition
  dom.laps.title.label.classList.remove("hidden")
  dom.laps.title.label.textContent = tasks[currentTask].name
  dom.laps.title.input.classList.add("hidden")

  const cutString = (str, maxLength) => str.length > maxLength ? str.slice(0, str.lastIndexOf(' ', maxLength)) + '...' : str;


  dom.tasks.list.innerHTML = 
    tasks.reduce((acc, cur, index) => acc += 
      `<li class="${index === currentTask ? "active" : ""}">
        <button onclick="setCurrentTask(${index})" class="select">
        ${cutString(cur.name, 16)}
        
        </button>
      </li>`, "")
}
 
// render laps list
const renderLaps = () => {
  dom.laps.list.innerHTML = 
    laps.reduce((acc, cur, index) => acc += `<li>
      ${formatTime(cur.time)} ${cur.title} 
      <span>
        ${index > 0 ? "+" + formatTime(cur.time - laps[index - 1].time, true) : "" }
        <button class="delete" onclick="deleteLap(${index})">x</button>
      </span>
    </li>`, "")
    
  dom.laps.title.label.textContent = tasks[currentTask].name
  dom.laps.title.input.value = tasks[currentTask].name
  dom.tasks.delete.classList.toggle("hidden", currentTask === 0)
  dom.laps.total.classList.toggle("hidden", laps.length === 0)
  dom.laps.total.textContent = laps.length > 0 ? `${formatTime(laps[laps.length - 1].time, true)} total` : ``
}

// render clock
const renderTime = t => 
  dom.time.innerHTML = formatTime(t)
 
// event listeners
// document.addEventListener("keydown", key => console.log(key))
// space toggles stopwatch
document.addEventListener("keydown", key => key.code === "Space" 
  && document.activeElement.tagName !== "INPUT"
  && document.activeElement.tagName !== "BUTTON" 
  && stopwatch())

// blur all inputs task
document.addEventListener("keydown", key => (key.code === "Escape" || key.code === "Enter")
  && document.activeElement.tagName === "INPUT"
  && document.activeElement.blur())

// new task
document.addEventListener("keydown", key => {
  if (key.code === "KeyT" && document.activeElement.tagName !== "INPUT") {
    key.preventDefault(); // This will prevent the "t" from being typed in the input
    newTask();
  }
})

// init
tasks = load()
laps = tasks[currentTask].laps
renderTasks()
renderLaps()

//get time from last lap if lap exists
time = laps.length ? laps[laps.length - 1].time : 0
renderTime(time)
