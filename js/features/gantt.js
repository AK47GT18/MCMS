import { notificationService } from '../services/notification.service.js';


// State
let ganttState = {
    tasks: [
        { id: 1, name: '1. Site Preparation', start: 1, duration: 2, status: 'done' },
        { id: 2, name: '2. Foundation Excavation', start: 3, duration: 3, status: 'progress' },
        { id: 3, name: '3. Concrete Pouring', start: 6, duration: 2, status: 'delayed' },
        { id: 4, name: '4. Steel Framework', start: 8, duration: 3, status: 'todo' }
    ],
    viewMode: 'week', // 'day', 'week', 'month'
    viewStart: 1,     // Start unit
    viewRange: 12     // Number of units to show
};

// Constants
const VIEW_CONFIG = {
    day: { header: 'Day', units: 30, pxPerUnit: 40, subDivisions: 1 },
    week: { header: 'Week', units: 12, pxPerUnit: 100, subDivisions: 7 }, // 12 Weeks
    month: { header: 'Month', units: 3, pxPerUnit: 300, subDivisions: 4 } // 3 Months (12 weeks)
};

// --- CORE FUNCTIONS ---

export function initGantt() {
    renderGantt();
    bindGanttEvents();
}

export function renderGantt() {
    const container = document.getElementById('gantt-chart-area');
    if(!container) return;

    // 1. Setup Grid & Header based on ViewMode
    setupGanttGrid(container);

    // 2. Render Rows
    ganttState.tasks.forEach(task => {
        renderTaskRow(container, task);
    });
}

function setupGanttGrid(container) {
    // Clear existing rows but keep header structure if we want to reuse it, 
    // but for view-switching we probably need to rewrite the header too.
    // For now, let's assume the HTML header is static-ish or we rewrite it.
    
    // Actually, let's look at the DOM. The header is .gantt-header. 
    // We should update .gantt-header cells based on view mode.
    
    const header = container.querySelector('.gantt-header');
    if(header) {
        // Clear Header Cells (except first one which is Task Name)
        const cells = Array.from(header.children);
        // Remove all except first
        for(let i=1; i<cells.length; i++) cells[i].remove();

        // Add new cells
        const config = VIEW_CONFIG[ganttState.viewMode];
        for(let i=1; i<=config.units; i++) {
            const cell = document.createElement('div');
            cell.className = 'gantt-header-cell';
            cell.innerText = config.header.charAt(0) + i; // W1, M1, D1...
            header.appendChild(cell);
        }
    }

    // Remove old rows
    container.querySelectorAll('.gantt-row').forEach(el => el.remove());
}

function renderTaskRow(container, task) {
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const config = VIEW_CONFIG[ganttState.viewMode];
    
    // Calculation
    // We need to map Task Start/Duration (which are in WEEKs) to current View Units.
    let startVal = task.start;     // Weeks
    let durationVal = task.duration; // Weeks

    if (ganttState.viewMode === 'day') {
        // 1 Week = 7 Days
        startVal = (task.start - 1) * 7 + 1; 
        durationVal = task.duration * 7;
    } else if (ganttState.viewMode === 'month') {
        // 1 Month = 4 Weeks
        startVal = (task.start - 1) / 4 + 1;
        durationVal = task.duration / 4;
    }

    const totalUnits = config.units;
    
    const leftPct = ( (startVal - 1) / totalUnits ) * 100;
    const widthPct = ( durationVal / totalUnits ) * 100;

    let statusClass = task.status; // 'done', 'progress', 'delayed', 'todo'
    
    // Clamp values if out of view (optional optimization, but CSS overflow hidden handles mostly)
    
    let label = task.status === 'progress' ? `In Progress` : 
                task.status === 'done' ? 'Complete' : 
                task.status === 'delayed' ? 'Delayed' : 'Planned';

    row.innerHTML = `
        <div class="gantt-task">${task.name}</div>
        <div class="gantt-bar-container" style="grid-column: 2 / span ${totalUnits}; position: relative; border-right: none;">
            <!-- Grid Lines -->
            <div style="position: absolute; top:0; left:0; width:100%; height:100%; display:grid; grid-template-columns:repeat(${totalUnits},1fr); pointer-events:none; z-index:0;">
                ${Array(totalUnits).fill('<div style="border-right:1px solid var(--slate-100);"></div>').join('')}
            </div>
            
            <!-- Bar -->
            <div class="gantt-bar ${statusClass}" 
                 style="left: ${leftPct}%; width: ${widthPct}%; z-index:1;"
                 title="${task.name}: ${task.duration} Weeks">
                ${label}
            </div>
        </div>
    `;
    container.appendChild(row);
}

// --- ACTIONS ---

export function switchGanttView(mode) {
    if(!['day', 'week', 'month'].includes(mode)) return;
    ganttState.viewMode = mode;
    
    // Update Active Button State (assuming buttons have IDs or classes)
    document.querySelectorAll('.btn-view-mode').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
        if(b.dataset.mode === mode) {
            b.classList.add('btn-primary');
            b.classList.remove('btn-secondary');
        }
    });

    renderGantt();
}

export function addTask(name, start, duration, unit) {
    // Convert logic if needed. For now assume inputs are Weeks based on current modal.
    // If unit is different, convert to weeks.
    let durationInWeeks = duration;
    if(unit === 'days') durationInWeeks = duration / 7;
    if(unit === 'months') durationInWeeks = duration * 4;

    ganttState.tasks.push({
        id: ganttState.tasks.length + 1,
        name: `${ganttState.tasks.length + 1}. ${name}`,
        start: Number(start),      // Input is always Start Week for now
        duration: Number(durationInWeeks),
        status: 'todo'
    });
    
    renderGantt();
}

function bindGanttEvents() {
    // Bind buttons if they exist
    // This is better called from dashboard.js or HTML onclicks mapping to window globals
}
