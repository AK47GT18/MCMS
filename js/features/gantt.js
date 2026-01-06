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
    day: { header: 'D', units: 30, pxPerUnit: 40, subDivisions: 1 },    // 30 Days
    week: { header: 'Week ', units: 12, pxPerUnit: 100, subDivisions: 7 }, // 12 Weeks
    month: { header: 'Month ', units: 6, pxPerUnit: 150, subDivisions: 4 }  // 6 Months
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
            // Custom label logic
            let label = config.header + i;
            if (ganttState.viewMode === 'day') label = `Day ${i}`;
            
            cell.innerText = label;
            header.appendChild(cell);
        }
        
        // Update grid columns style globally for this container
        const totalCols = config.units + 1; // +1 for Task Name
        // We need to apply this to the grid layout if it uses grid-template-columns
        // But the current HTML seems to use flex or manual layout in rows.
        // Let's rely on the row renderer to respect the units.
        
        // Actually, let's update the grid background
        const gridBg = container.querySelector('.gantt-grid-bg');
        if(gridBg) {
             gridBg.style.gridTemplateColumns = `repeat(${config.units}, 1fr)`;
        }
    }

    // Remove old rows
    container.querySelectorAll('.gantt-row').forEach(el => el.remove());
}

function renderTaskRow(container, task) {
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const config = VIEW_CONFIG[ganttState.viewMode];
    
    // Calculation: Task.start and Task.duration are stored in WEEKS (base unit)
    // We need to convert them to result view UNITS.
    
    let startVal = task.start;     
    let durationVal = task.duration;

    if (ganttState.viewMode === 'day') {
        // 1 Week = 7 Days
        // Start Week 1 starts at Day 1. Start Week 2 starts at Day 8.
        startVal = ((task.start - 1) * 7) + 1; 
        durationVal = task.duration * 7;
    } else if (ganttState.viewMode === 'month') {
        // 1 Month = Approx 4 Weeks.
        // Start Week 1 -> Month 0.25? Let's simplify: 1 Month = 4 Weeks.
        startVal = ((task.start - 1) / 4) + 1;
        durationVal = task.duration / 4;
    }
    // 'week' is 1:1

    const totalUnits = config.units;
    
    // Bounds Check: If task is completely outside view, maybe hide or clip?
    // css overflow:hidden on container usually handles this, but let's clamp for bar positioning
    
    // Percentages for CSS
    const leftPct = ( (startVal - 1) / totalUnits ) * 100;
    const widthPct = ( durationVal / totalUnits ) * 100;

    let statusClass = task.status; 
    let label = task.status === 'progress' ? `In Progress` : 
                task.status === 'done' ? 'Complete' : 
                task.status === 'delayed' ? 'Delayed' : 'Planned';

    row.innerHTML = `
        <div class="gantt-task">${task.name}</div>
        <div class="gantt-bar-container" style="position: relative; border-right: none;">
            <!-- Grid Lines (One for each unit) -->
            <div class="gantt-grid-bg" style="position: absolute; top:0; left:0; width:100%; height:100%; display:grid; grid-template-columns:repeat(${totalUnits},1fr); pointer-events:none; z-index:0;">
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
    
    // Update Active Button State
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
