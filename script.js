// Current Time & Date
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('currentDate').textContent = dateString;
}

// Timer functionality
let timerSeconds = 0;
let timerInterval = null;
let isTimerRunning = false;

function setTimer(minutes) {
    timerSeconds = minutes * 60;
    updateTimerDisplay();
    resetTimer();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerValue').textContent = display;
}

function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerSeconds === 0) {
        timerSeconds = 25 * 60; // Default to 25 minutes
    }
    
    isTimerRunning = true;
    document.getElementById('startBtn').textContent = 'Pause';
    document.getElementById('timerLabel').textContent = 'Focus time...';
    document.getElementById('timerDisplay').classList.add('timer-active');
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            finishTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startBtn').textContent = 'Resume';
    document.getElementById('timerLabel').textContent = 'Paused';
    document.getElementById('timerDisplay').classList.remove('timer-active');
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startBtn').textContent = 'Start';
    document.getElementById('timerLabel').textContent = 'Ready to start';
    document.getElementById('timerDisplay').classList.remove('timer-active');
    updateTimerDisplay();
}

function finishTimer() {
    resetTimer();
    document.getElementById('timerLabel').textContent = 'Time\'s up! 🎉';
    playNotificationSound();
}

function playNotificationSound() {
    // Browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("TimeFlow", {
            body: "Timer completed! Take a break.",
            icon: "⏰"
        });
    }
}

// Task Management
let tasks = JSON.parse(localStorage.getItem('timeflow_tasks')) || [];
let currentFilter = 'all';

function saveTasks() {
    localStorage.setItem('timeflow_tasks', JSON.stringify(tasks));
    updateStats();
}

function handleTaskInput(event) {
    if (event.key === 'Enter' && event.target.value.trim()) {
        const category = document.getElementById('taskCategory').value;
        addTask(event.target.value.trim(), category);
        event.target.value = '';
    }
}

function addTask(text, category = 'work') {
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        category: category,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function filterTasks(category) {
    currentFilter = category;
    
    // Update active chip
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.category === category) {
            chip.classList.add('active');
        }
    });
    
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const filteredTasks = currentFilter === 'all' 
        ? tasks 
        : tasks.filter(t => t.category === currentFilter);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">No tasks in this category</div>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="toggleTask(${task.id})">
            </div>
            <div class="task-text">${task.text}</div>
            <div class="task-category-label">${task.category}</div>
            <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
        </div>
    `).join('');
}

function updateStats() {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

// Mind Map Functionality
let mindMapNodes = JSON.parse(localStorage.getItem('timeflow_mindmap')) || [];
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;
let selectedEmoji = '💡';
let selectedColor = 'pink-yellow';

const colorThemes = {
    'pink-yellow': 'linear-gradient(135deg, #FD79A8, #FDCB6E)',
    'purple': 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
    'green': 'linear-gradient(135deg, #00B894, #00D2A0)',
    'red': 'linear-gradient(135deg, #FF6B9D, #FFA07A)',
    'blue': 'linear-gradient(135deg, #74B9FF, #0984E3)',
    'orange': 'linear-gradient(135deg, #FAB1A0, #E17055)'
};

function selectEmoji(emoji) {
    selectedEmoji = emoji;
    
    // Update visual selection
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === emoji) {
            btn.classList.add('selected');
        }
    });
}

function selectColor(colorName) {
    selectedColor = colorName;
    
    // Update visual selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function updateMainIdea() {
    const text = document.getElementById('mainIdeaText').value.trim() || 'Main Idea';
    const centralNode = document.getElementById('centralNode');
    
    if (centralNode) {
        centralNode.querySelector('.node-content').textContent = `${selectedEmoji} ${text}`;
        centralNode.style.background = colorThemes[selectedColor];
        
        // Save to localStorage
        localStorage.setItem('timeflow_mainIdea', JSON.stringify({
            text: text,
            emoji: selectedEmoji,
            color: selectedColor
        }));
        
        // Show success feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Updated!';
        btn.style.background = 'linear-gradient(135deg, #00D2A0, #00B894)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }
}

function loadMainIdea() {
    const saved = JSON.parse(localStorage.getItem('timeflow_mainIdea'));
    if (saved) {
        document.getElementById('mainIdeaText').value = saved.text;
        selectedEmoji = saved.emoji || '💡';
        selectedColor = saved.color || 'pink-yellow';
        
        const centralNode = document.getElementById('centralNode');
        if (centralNode) {
            centralNode.querySelector('.node-content').textContent = `${saved.emoji} ${saved.text}`;
            centralNode.style.background = colorThemes[saved.color];
        }
        
        // Update visual selections
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            if (btn.textContent === saved.emoji) {
                btn.classList.add('selected');
            }
        });
        
        document.querySelectorAll('.color-btn').forEach((btn, index) => {
            const colors = ['pink-yellow', 'purple', 'green', 'red', 'blue', 'orange'];
            if (colors[index] === saved.color) {
                btn.classList.add('selected');
            }
        });
    }
}

function saveMindMap() {
    localStorage.setItem('timeflow_mindmap', JSON.stringify(mindMapNodes));
}

function handleMindMapInput(event) {
    if (event.key === 'Enter' && event.target.value.trim()) {
        addMindMapNode(event.target.value.trim());
        event.target.value = '';
    }
}

function addMindMapNode(text) {
    if (!text) {
        text = document.getElementById('mindMapInput').value.trim();
        document.getElementById('mindMapInput').value = '';
    }
    
    if (!text) return;

    const node = {
        id: Date.now(),
        text: text,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
    };

    mindMapNodes.push(node);
    saveMindMap();
    renderMindMap();
}

function deleteMindMapNode(id) {
    mindMapNodes = mindMapNodes.filter(n => n.id !== id);
    saveMindMap();
    renderMindMap();
}

function clearMindMap() {
    if (confirm('Are you sure you want to clear all ideas?')) {
        mindMapNodes = [];
        saveMindMap();
        renderMindMap();
    }
}

function renderMindMap() {
    const container = document.getElementById('mindMapNodes');
    container.innerHTML = mindMapNodes.map(node => `
        <div class="mindmap-branch" 
             id="node-${node.id}"
             style="left: ${node.x}px; top: ${node.y}px;"
             draggable="true"
             ondragstart="startDrag(event, ${node.id})"
             ondrag="drag(event, ${node.id})"
             ondragend="endDrag(event, ${node.id})">
            ${node.text}
            <div class="delete-node" onclick="deleteMindMapNode(${node.id})">×</div>
        </div>
    `).join('');
    
    // Draw connection lines
    drawConnections();
}

function drawConnections() {
    const svg = document.getElementById('mindMapSVG');
    const canvas = document.getElementById('mindMapCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    const centralNode = document.getElementById('centralNode');
    
    if (!centralNode) return;
    
    const centralRect = centralNode.getBoundingClientRect();
    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;
    
    // Clear existing lines
    svg.innerHTML = '';
    
    // Draw line to each node
    mindMapNodes.forEach(node => {
        const nodeElement = document.getElementById(`node-${node.id}`);
        if (!nodeElement) return;
        
        const nodeRect = nodeElement.getBoundingClientRect();
        const nodeX = node.x + (nodeRect.width / 2);
        const nodeY = node.y + (nodeRect.height / 2);
        
        // Create curved path
        const dx = nodeX - centerX;
        const dy = nodeY - centerY;
        const controlX = centerX + dx * 0.5;
        const controlY = centerY + dy * 0.5;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-line');
        path.setAttribute('d', `M ${centerX} ${centerY} Q ${controlX} ${controlY} ${nodeX} ${nodeY}`);
        
        svg.appendChild(path);
    });
}

function startDrag(event, id) {
    draggedElement = event.target;
    const rect = draggedElement.getBoundingClientRect();
    const canvasRect = document.getElementById('mindMapCanvas').getBoundingClientRect();
    
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    
    draggedElement.classList.add('dragging');
}

function drag(event, id) {
    if (!draggedElement) return;
    event.preventDefault();
    
    // Update visual position during drag for smooth feedback
    const canvasRect = document.getElementById('mindMapCanvas').getBoundingClientRect();
    const newX = event.clientX - canvasRect.left - offsetX;
    const newY = event.clientY - canvasRect.top - offsetY;
    
    draggedElement.style.left = newX + 'px';
    draggedElement.style.top = newY + 'px';
    
    // Redraw connections
    drawConnections();
}

function endDrag(event, id) {
    if (!draggedElement) return;
    
    const canvasRect = document.getElementById('mindMapCanvas').getBoundingClientRect();
    const newX = event.clientX - canvasRect.left - offsetX;
    const newY = event.clientY - canvasRect.top - offsetY;
    
    // Update node position
    const node = mindMapNodes.find(n => n.id === id);
    if (node) {
        node.x = Math.max(0, Math.min(newX, canvasRect.width - 150));
        node.y = Math.max(0, Math.min(newY, canvasRect.height - 50));
        saveMindMap();
        drawConnections(); // Redraw connections with final position
    }
    
    draggedElement.classList.remove('dragging');
    draggedElement = null;
}

// Initialize
updateCurrentTime();
setInterval(updateCurrentTime, 1000);
updateTimerDisplay();
renderTasks();
updateStats();

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

// Prevent default drag behavior
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

// Redraw connections on window resize
window.addEventListener('resize', () => {
    drawConnections();
});

// Initialize Mind Map
renderMindMap();
loadMainIdea();
