import { StatusBadge } from '../ui/StatusBadge.js';

export function GanttRow({ task, startOffset, duration, status, assignee }) {
    // startOffset: approximate % or grid column
    // duration: approximate width %
    
    return `
        <div class="flex items-center py-3 border-b border-slate-100 hover:bg-slate-50">
            <div class="w-1/4 pr-4">
                <p class="text-sm font-medium text-slate-900 truncate">${task}</p>
                <p class="text-xs text-slate-500">${assignee}</p>
            </div>
            <div class="flex-1 relative h-8 bg-slate-50 rounded">
                <div class="absolute top-1 bottom-1 bg-blue-500 rounded text-white text-[10px] flex items-center justify-center truncate px-2 opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
                     style="left: ${startOffset}%; width: ${duration}%;"
                     title="${task} (${status})">
                     ${status === 'Active' ? 'In Progress' : status}
                </div>
            </div>
            <div class="w-24 pl-4 flex justify-end">
                ${StatusBadge({ status })}
            </div>
        </div>
    `;
}
