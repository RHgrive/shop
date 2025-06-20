const API_BASE = "https://8883-106-160-31-181.ngrok-free.app/api"
document.addEventListener('DOMContentLoaded',()=>{
  const order_id = location.pathname.split('/').pop()
  const taskList = document.getElementById('taskList')
  const log = document.getElementById('log')
  const loginCode = document.getElementById('loginCode')
  const loginBtn = document.getElementById('loginBtn')

  function renderTasks(tasks){
    taskList.innerHTML = tasks.map(t=>`<li data-id="${t.id}"${t.done?' class="task-complete"':''}>${t.name}<button class="task-btn"${t.done?' disabled':''} aria-label="実行">代行する</button></li>`).join('')
  }

  function appendLog(e){
    const div = document.createElement('div')
    div.textContent = e.data
    log.appendChild(div)
  }

  function fetchTasks(){
    fetch(`${API_BASE}/order/${order_id}`)
      .then(r=>r.json())
      .then(d=>{if(Array.isArray(d.tasks))renderTasks(d.tasks)})
      .catch(()=>alert('タスク取得に失敗しました'))
  }

  taskList.addEventListener('click',e=>{
    if(e.target.matches('.task-btn')){
      const li=e.target.closest('li')
      const id=li.dataset.id
      fetch(`${API_BASE}/order/${order_id}/execute/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:loginCode.value})})
        .then(r=>{if(r.ok){e.target.disabled=true;li.classList.add('task-complete')}else{alert('実行に失敗しました')}})
        .catch(()=>alert('実行に失敗しました'))
    }
  })

  let evt
  function connect(){
    evt=new EventSource(`${API_BASE}/order/${order_id}/stream`)
    evt.onmessage=e=>{
      appendLog(e)
      try{
        const j=JSON.parse(e.data)
        if(j.done){
          const li=taskList.querySelector(`li[data-id="${j.id}"]`)
          if(li){
            li.classList.add('task-complete')
            const b=li.querySelector('.task-btn')
            if(b)b.disabled=true
          }
        }
      }catch{}
    }
    evt.onerror=()=>{
      evt.close()
      setTimeout(connect,5000)
    }
  }
  loginBtn.addEventListener('click',()=>{
    fetch(`${API_BASE}/login/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:loginCode.value})})
      .then(r=>{if(r.ok){fetchTasks();connect()}else{alert('コードが無効です')}})
  })
})
