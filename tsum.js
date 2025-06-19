document.addEventListener('DOMContentLoaded',()=>{
  const order_id = location.pathname.split('/').pop()
  const taskList = document.getElementById('taskList')
  const log = document.getElementById('log')
  const loginCode = document.getElementById('loginCode')
  const loginBtn = document.getElementById('loginBtn')

  function renderTasks(tasks){
    taskList.innerHTML = tasks.map(t=>`<li data-id="${t.id}"${t.done?' class="task-complete"':''}>${t.name}</li>`).join('')
  }

  function appendLog(e){
    const div = document.createElement('div')
    div.textContent = e.data
    log.appendChild(div)
  }

  fetch('/api/order/'+order_id)
    .then(r=>r.json())
    .then(d=>{if(Array.isArray(d.tasks))renderTasks(d.tasks)})
    .catch(()=>alert('タスク取得に失敗しました'))

  taskList.addEventListener('click',e=>{
    if(e.target.matches('li')){
      const id=e.target.dataset.id
      fetch('/api/order/'+order_id+'/execute/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:loginCode.value})})
        .catch(()=>alert('実行に失敗しました'))
    }
  })

  const evt=new EventSource('/api/order/'+order_id+'/stream')
  evt.onmessage=e=>{
    appendLog(e)
    try{
      const j=JSON.parse(e.data)
      if(j.done){
        const li=taskList.querySelector(`li[data-id="${j.id}"]`)
        if(li)li.classList.add('task-complete')
      }
    }catch{}
  }
})
