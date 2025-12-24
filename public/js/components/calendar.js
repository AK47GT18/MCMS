/**
 * Calendar Component
 * Handles calendar/date picker functionality
 */
const CalendarComponent = {
  currentDate: new Date(),
  selectedDate: null,
  
  /**
   * Initialize calendar
   */
  init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentDate = options.initialDate || new Date();
    this.selectedDate = options.selectedDate || null;
    this.onSelect = options.onSelect || null;

    this.render(container);
  },

  /**
   * Render calendar
   */
  render(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    let html = `
      <div style="max-width: 350px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 20px; background: linear-gradient(135deg, var(--orange) 0%, var(--orange-dark) 100%); color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <button onclick="CalendarComponent.previousMonth()" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            "><i class="fas fa-chevron-left"></i></button>
            <div style="font-weight: 700; font-size: 18px;">
              ${monthNames[month]} ${year}
            </div>
            <button onclick="CalendarComponent.nextMonth()" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            "><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 16px;">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
              <div style="text-align: center; font-weight: 700; font-size: 12px; color: var(--slate-500); padding: 8px 0;">
                ${day}
              </div>
            `).join('')}
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
            ${Array(firstDay).fill(null).map(() => '<div></div>').join('')}
            ${Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const isSelected = this.selectedDate && 
                date.getDate() === this.selectedDate.getDate() &&
                date.getMonth() === this.selectedDate.getMonth() &&
                date.getFullYear() === this.selectedDate.getFullYear();
              
              return `
                <button onclick="CalendarComponent.selectDate(new Date(${year}, ${month}, ${day}))" style="
                  padding: 8px;
                  border: 2px solid ${isSelected ? 'var(--orange)' : 'var(--slate-200)'};
                  background: ${isSelected ? 'var(--orange)' : 'white'};
                  color: ${isSelected ? 'white' : 'var(--slate-900)'};
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 14px;
                  transition: var(--transition);
                ">
                  ${day}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Select date
   */
  selectDate(date) {
    this.selectedDate = date;
    if (this.onSelect) {
      this.onSelect(date);
    }
  },

  /**
   * Previous month
   */
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
  },

  /**
   * Next month
   */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
  },

  /**
   * Get selected date as string
   */
  getSelectedDateString() {
    if (!this.selectedDate) return '';
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};
