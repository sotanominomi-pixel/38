const slider = document.getElementById('sliderHours');
const labelHours = document.getElementById('labelHours');
const display = document.getElementById('display');
const tabClock = document.getElementById('tabClock');
const tabStopwatch = document.getElementById('tabStopwatch');
const tabAlarm = document.getElementById('tabAlarm');
const stopwatchArea = document.getElementById('stopwatchArea');
const alarmArea = document.getElementById('alarmArea');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsDiv = document.getElementById('laps');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const newAlarmTime = document.getElementById('newAlarmTime');
const alarmsDiv = document.getElementById('alarms');

let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
slider.value = customHours;
labelHours.textContent = `${customHours} 時間`;

let mode = localStorage.getItem('nclock_mode') || 'clock';

let running = false;
let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')) || 0;
let lastPerf = null;
let laps = JSON.parse(localStorage.getItem('nclock_sw_laps')||'[]');
let alarms = JSON.parse(localStorage.getItem('nclock_alarms')||'[]');

renderLaps();
renderAlarms();

function saveSettings(){
  localStorage.setItem('nclock_hours', String(customHours));
  localStorage.setItem('nclock_mode', mode);
  localStorage.setItem('nclock_sw_elapsed', String(elapsedMs));
  localStorage.setItem('nclock_sw_laps', JSON.stringify(laps));
  localStorage.setItem('nclock_alarms', JSON.stringify(alarms));
}

slider.addEventListener('input', e=>{
  customHours = Number(e.target.value);
  labelHours.textContent = `${customHours} 時間`;
  saveSettings();
});

function switchMode(newMode){
  mode = newMode;
  tabClock.classList.toggle('active', mode==='clock');
  tabStopwatch.classList.toggle('active', mode==='stopwatch');
  tabAlarm.classList.toggle('active', mode==='alarm');

  stopwatchArea.style.display = mode==='stopwatch' ? 'block' : 'none';
  alarmArea.style.display = mode==='alarm' ? 'block' : 'none';
  document.getElementById('sliderBox').style.display = mode==='clock' ? 'block' : 'none';
  saveSettings();
}

tabClock.addEventListener('click', ()=>switchMode('clock'));
tabStopwatch.addEventListener('click', ()=>switchMode('stopwatch'));
tabAlarm.addEventListener('click', ()=>switchMode('alarm'));

/* Stopwatch buttons */
startBtn.addEventListener('click', ()=>{
  if(!running){
    running = true;
    lastPerf = performance.now();
    startBtn.textContent = 'Stop';
    startBtn.classList.remove('btn-start'); startBtn.classList.add('btn-stop');
    lapBtn.disabled = false; resetBtn.disabled = true;
  } else {
    running = false;
    startBtn.textContent = 'Start';
    startBtn.classList.remove('btn-stop'); startBtn.classList.add('btn-start');
    lapBtn.disabled = true; resetBtn.disabled = false;
    saveSettings();
  }
});

lapBtn.addEventListener('click', ()=>{
  const txt = display.textContent;
  laps.unshift(txt);
  if(laps.length>50) laps.pop();
  renderLaps();
  saveSettings();
});

resetBtn.addEventListener('click', ()=>{
  elapsedMs = 0; laps = [];
  renderLaps();
  resetBtn.disabled = true;
  saveSettings();
});

function renderLaps(){
  lapsDiv.innerHTML = laps.length===0 ? '<div style="color:var(--muted); padding:8px;">ラップなし</div>'
    : laps.map((t,i)=>`<div class="lap-item"><div>Lap ${laps.length-i}</div><div>${t}</div></div>`).join('');
}

/* Alarms */
addAlarmBtn.addEventListener('click', ()=>{
  const t = newAlarmTime.value;
  if(!t) return;
  alarms.push({time:t, on:true});
  renderAlarms();
  saveSettings();
});

function renderAlarms(){
  alarmsDiv.innerHTML = '';
  alarms.forEach((a,i)=>{
    const div = document.createElement('div');
    div.style.display='flex'; div.style.justifyContent='space-between'; div.style.alignItems='center';
    div.style.margin='6px 0';
    div.innerHTML = `<span>${a.time}</span>
      <label class="switch">
        <input type="checkbox" data-index="${i}" ${a.on?'checked':''}>
        <span class="slider round"></span>
      </label>
      <button data-index="${i}" class="btn-delete">×</button>`;
    alarmsDiv.appendChild(div);
  });

  document.querySelectorAll('.btn-delete').forEach(b=>{
    b.addEventListener('click', e=>{
      const idx = e.target.dataset.index;
      alarms.splice(idx,1);
      renderAlarms();
      saveSettings();
    });
  });
  document.querySelectorAll('.switch input').forEach(c=>{
    c.addEventListener('change', e=>{
      const idx = e.target.dataset.index;
      alarms[idx].on = e.target.checked;
      saveSettings();
    });
  });
}

/* Clock/Stopwatch tick */
function tick(now){
  if(running){
    const dt = now - lastPerf;
    elapsedMs += dt*(24/customHours);
    lastPerf = now;
  }

  if(mode==='clock'){
    const realDate = new Date();
    const h = realDate.getHours();
    const m = realDate.getMinutes();
    const s = realDate.getSeconds();
    display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else if(mode==='stopwatch'){
    const totalSec = Math.floor(elapsedMs/1000);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor(totalSec/60)%60;
    const s = totalSec%60;
    display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

setInterval(saveSettings,2000);

/* SW registration */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
