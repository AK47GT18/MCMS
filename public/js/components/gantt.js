// public/js/components/gantt.js
class GanttChartManager {
    constructor(containerId, projectId) {
        this.container = document.getElementById(containerId);
        this.projectId = projectId;
        this.gantt = null;
        this.init();
    }
    
    async init() {
        // Load DHTMLX Gantt CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/8.0.6/dhtmlxgantt.min.css';
        document.head.appendChild(link);
        
        // Load DHTMLX Gantt JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/8.0.6/dhtmlxgantt.min.js';
        script.onload = () => this.initGantt();
        document.head.appendChild(script);
    }
    
    async initGantt() {
        gantt.config.date_format = "%Y-%m-%d";
        gantt.config.readonly = false;
        gantt.config.show_progress = true;
        gantt.config.grid_width = 400;
        
        // Custom columns
        gantt.config.columns = [
            {name: "text", label: "Task", tree: true, width: 200},
            {name: "start_date", label: "Start", align: "center", width: 80},
            {name: "duration", label: "Days", align: "center", width: 60},
            {name: "progress", label: "Progress", align: "center", width: 80}
        ];
        
        gantt.init(this.container);
        await this.loadData();
        
        // Event handlers
        gantt.attachEvent("onAfterTaskAdd", (id, item) => this.saveTask(item));
        gantt.attachEvent("onAfterTaskUpdate", (id, item) => this.updateTask(item));
        gantt.attachEvent("onAfterTaskDelete", (id) => this.deleteTask(id));
    }
    
    async loadData() {
        try {
            const response = await fetch(`/api/v1/projects/${this.projectId}/gantt-data`);
            const data = await response.json();
            gantt.parse(data);
        } catch (error) {
            console.error('Failed to load Gantt data:', error);
        }
    }
    
    async saveTask(task) {
        try {
            await fetch(`/api/v1/projects/${this.projectId}/tasks`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(task)
            });
        } catch (error) {
            console.error('Failed to save task:', error);
        }
    }
    
    async updateTask(task) {
        try {
            await fetch(`/api/v1/projects/${this.projectId}/tasks/${task.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(task)
            });
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }
    
    async deleteTask(id) {
        try {
            await fetch(`/api/v1/projects/${this.projectId}/tasks/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }
    
    exportToPDF() {
        gantt.exportToPDF({
            name: `project-${this.projectId}-gantt.pdf`,
            locale: 'en'
        });
    }
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
    const projectId = document.querySelector('[data-project-id]')?.dataset.projectId;
    if (projectId) {
        window.ganttChart = new GanttChartManager('gantt-container', projectId);
    }
});