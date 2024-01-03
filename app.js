const dom = {
  time: document.querySelector(".time"),
  tasks: {
    title: {
      label: document.querySelector(".laps h2"),
      input: document.querySelector(".laps .task-title"),
    },
    list: document.querySelector(".tasks ul"),
    new: document.querySelector(".tasks .new-task"),
    delete: document.querySelector(".laps .delete"),
  },
  laps : {
    title: {
      label: document.querySelector(".main h1"),
      input: document.querySelector(".main .lap-title"),
    },
    list: document.querySelector(".laps ul"),
    total: document.querySelector(".laps .total"),
  },
  stopwatch: {
    toggle: document.querySelector(".stopwatch-toggle"),
  },
  help: {
    dialog: document.querySelector("dialog"),
    content: document.querySelector("dialog pre"),
    close: document.querySelector("dialog button"),
  },
}

let time = 0
let laps = []
let lapTitle = ""
let tasks = []
let currentTask = 0
let isRunning = null
let startTime
let intervalId

const start = () => {
  // startTime = new Date() - time * 1000
  renderTime(time = 0)
  startTime = new Date()
  return setInterval(() => renderTime(time = Math.floor((new Date() - startTime) / 1000)), 1000)
}

const stop = () => clearInterval(isRunning)

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
    laps = [{time: time, title: lapTitle}, ...laps]
    tasks[currentTask].laps = laps
    save()
    renderLaps()
  }
}

// tasks
// new task should be made current and time reset to 0
const newTask = () => {
  if (isRunning) return
  tasks.unshift({ name: "", laps: [] })
  setCurrentTask(0)
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
  
  dom.tasks.title.label.textContent = tasks[currentTask].name
  dom.tasks.title.input.value = tasks[currentTask].name
  dom.laps.title.label.textContent = "what are you doing?"
  dom.laps.title.input.value = ""

  // renderTime(time = loadTime())
  renderTime(time = 0)
  renderLaps()
  renderTasks()
}

// enter edition mode on task title
const editTaskTitle = e => {
  dom.tasks.title.label.classList.add("hidden")
  dom.tasks.title.input.classList.remove("hidden")
  dom.tasks.title.input.focus()
}

// edit a task title and leave edition
const setTaskTitle = e => {
  tasks[currentTask].name = e.target.value.trim().length !== 0 ? e.target.value.trim() : "new task"
  save()
  renderTasks()

  // reset task edition
  dom.tasks.title.label.classList.remove("hidden")
  dom.tasks.title.label.textContent = tasks[currentTask].name
  dom.tasks.title.input.classList.add("hidden") 
}

// load last lap time
const loadTime = () => laps.length > 0 ? laps[0].time : 0

// laps
// enter edition mode on lap title
const editLapTitle = e => {
  dom.laps.title.label.classList.add("hidden")
  dom.laps.title.input.classList.remove("hidden")
  dom.laps.title.input.focus()
}

// set current lap title
const setLapTitle = e => {
  // reset lap edition
  dom.laps.title.input.classList.add("hidden")
  dom.laps.title.label.classList.remove("hidden")

  if (e.target.value.trim().length === 0) return  
  lapTitle = e.target.value.trim()
  dom.laps.title.label.textContent = lapTitle 
} 

// delete a lap, save and re-render
const deleteLap = index => {
  if (isRunning) return  
  laps.splice(index, 1)
  tasks[currentTask].laps = laps
  renderLaps()
  save()  

  // if the last lap was deleted, update the timer
  if (index === 0) {
    renderTime(time = laps.length > 0 ? laps[0].time : 0)
  }
}

// lap detail
const showLapDetail = e => 
  e.currentTarget.classList.toggle("active")

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
  const cutString = (str, maxLength) => str.length > maxLength ? str.slice(0, str.lastIndexOf(' ', maxLength)) + '...' : str
  dom.tasks.list.innerHTML = 
    tasks.reduce((acc, cur, index) => acc += 
      `<li class="${index === currentTask ? "active" : ""}">
        <button onclick="setCurrentTask(${index})" class="select">${cutString(cur.name, 16)}</button>
      </li>`, "")
}
 
// render laps list
const renderLaps = () => {
  dom.laps.list.innerHTML = 
    laps.reduce((acc, cur, index, array) => {
      // calculate the cumulative sum from all laps til this one
      let cumulativeSum = 0;
      for (let i = array.length - 1; i >= index; i--) {
          cumulativeSum += array[i].time;
      }

      return acc += `<li onclick="showLapDetail(event)">
        ${formatTime(cumulativeSum)} ${cur.title.trim().length ? '- ' + cur.title : ''}
        <span>
          ${index < laps.length - 1? "+" + formatTime(cur.time, true) : "" }
          <button class="delete" onclick="deleteLap(${index})" title="Delete"></button>
        </span>
      </li>`
    } , "")

  dom.tasks.delete.classList.toggle("hidden", currentTask === 0)
  dom.laps.total.classList.toggle("hidden", laps.length === 0)
  // todo
  dom.laps.total.textContent = laps.length > 0 ? `${formatTime(laps.reduce((acc, cur) => acc + cur.time, 0), true)} total` : ``
}

// render clock
const renderTime = t => dom.time.innerHTML = formatTime(t)
 
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
  if (key.key === "+" && document.activeElement.tagName !== "INPUT") {
    key.preventDefault()
    newTask()
  }
})

// rename task
document.addEventListener("keydown", key => {
  if (key.code === "KeyT" && document.activeElement.tagName !== "INPUT") {
    key.preventDefault()
    editTaskTitle()
  }
})

// rename lap
document.addEventListener("keydown", key => {
  if (key.code === "KeyL" && document.activeElement.tagName !== "INPUT") {
    key.preventDefault()
    editLapTitle()
  }
})

// help
const helpDialog = () => {
  dom.help.dialog.showModal()
}

document.querySelector(".help").addEventListener("click", () => document.querySelector("dialog").showModal())
dom.help.close.addEventListener("click", () => document.querySelector("dialog").close())

// init
tasks = load()
laps = tasks[currentTask].laps
setCurrentTask(0)

// get time from last lap if lap exists
// renderTime(time = loadTime())

// toggle button label
dom.stopwatch.toggle.textContent = dom.stopwatch.toggle.dataset.start

// load help content
fetch('https://raw.githack.com/lintmycode/stopwatch/main/README.md')
  .then(response => response.text())
  .then(text => dom.help.content.textContent = text);
  