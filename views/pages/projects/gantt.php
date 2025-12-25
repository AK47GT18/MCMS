<?php
/**
 * Projects - Gantt Chart Page
 */
$projectId = $_GET['id'] ?? null;
$pageTitle = 'Gantt Chart';
$currentPage = 'projects';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="breadcrumb">
        <span>Project Management</span>
        <i class="fas fa-chevron-right"></i>
        <span><a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>">Project Details</a></span>
        <i class="fas fa-chevron-right"></i>
        <span>Gantt Chart</span>
    </div>
    <div class="header-title">
        <h1>📊 Gantt Chart</h1>
        <div class="header-actions">
            <div class="btn-group">
                <button class="btn btn-secondary active" onclick="setScale('day')">Day</button>
                <button class="btn btn-secondary" onclick="setScale('week')">Week</button>
                <button class="btn btn-secondary" onclick="setScale('month')">Month</button>
            </div>
            <button class="btn btn-primary" onclick="gantt.createTask()">
                <i class="fas fa-plus"></i> Add Task
            </button>
        </div>
    </div>
</div>

<div class="content" style="height: calc(100vh - 140px); padding-bottom: 0;">
    <div id="gantt_here" style='width:100%; height:100%; box-shadow: var(--shadow); border-radius: var(--radius); overflow: hidden;'></div>
</div>

<!-- DHTMLX Gantt CSS/JS is loaded in main.php layout -->

<script>
document.addEventListener('DOMContentLoaded', () => {
    initGantt();
});

function initGantt() {
    // Basic Configuration
    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.config.order_branch = true;
    gantt.config.order_branch_free = true;
    gantt.config.open_tree_initially = true;
    
    // Columns configuration
    gantt.config.columns = [
        {name: "text", label: "Task Name", width: "*", tree: true},
        {name: "start_date", label: "Start Time", align: "center"},
        {name: "duration", label: "Duration", align: "center"},
        {name: "add", label: "", width: 44}
    ];

    // Styling
    gantt.templates.task_class = function(start, end, task){
        switch(task.priority){
            case "1": return "high";
            case "2": return "medium";
            case "3": return "low";
        }
        return "";
    };

    // Initialize
    gantt.init("gantt_here");

    // Load Data
    loadGanttData();
    
    // Data Processor for CRUD operations
    const dp = new gantt.dataProcessor("<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>/gantt");
    dp.init(gantt);
    dp.setTransactionMode("REST");
}

async function loadGanttData() {
    gantt.message("Loading data...");
    try {
        const response = await fetch("<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>/gantt");
        const data = await response.json();
        
        if (data.success) {
            gantt.parse(data.data);
            gantt.message({type:"success", text:"Data loaded"});
        } else {
            gantt.message({type:"error", text:"Failed to load data"});
        }
    } catch (e) {
        console.error(e);
        gantt.message({type:"error", text:"Server error"});
    }
}

function setScale(scale) {
    document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    switch (scale) {
        case "day":
            gantt.config.scale_unit = "day";
            gantt.config.date_scale = "%d %M";
            gantt.config.subscales = [];
            gantt.config.scale_height = 27;
            gantt.config.min_column_width = 30;
            break;
        case "week":
            gantt.config.scale_unit = "week";
            gantt.config.date_scale = "Week #%W";
            gantt.config.subscales = [
                {unit: "day", step: 1, date: "%D"}
            ];
            gantt.config.scale_height = 50;
            gantt.config.min_column_width = 50;
            break;
        case "month":
            gantt.config.scale_unit = "month";
            gantt.config.date_scale = "%F, %Y";
            gantt.config.subscales = [
                {unit: "week", step: 1, date: "#%W"}
            ];
            gantt.config.scale_height = 50;
            gantt.config.min_column_width = 50;
            break;
    }
    gantt.render();
}
</script>

<style>
    /* Custom Gantt Styles to match theme */
    .gantt_task_line {
        background-color: var(--blue);
        border-color: var(--blue);
    }
    .gantt_task_progress {
        background-color: rgba(0,0,0,0.2);
    }
    .gantt_task_line.high { background-color: var(--red); border-color: var(--red); }
    .gantt_task_line.medium { background-color: var(--orange); border-color: var(--orange); }
    .gantt_task_line.low { background-color: var(--emerald); border-color: var(--emerald); }
    
    .gantt_grid_scale {
        background-color: var(--slate-50);
        color: var(--slate-500);
        font-weight: bold;
    }
    .gantt_task_scale {
        background-color: var(--slate-50);
        color: var(--slate-500);
    }
</style>

