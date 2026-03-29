/**
 * NotificationService
 * Responsible for handling system-wide alerts and email notifications.
 * Currently mocked to simulate backend email triggers.
 */
class NotificationService {
    /**
     * Sends an email notification to the specified recipient.
     * In this implementation, it logs to the console and shows a toast.
     * 
     * @param {Object} options
     * @param {string} options.to - Recipient role or email
     * @param {string} options.subject - Email subject
     * @param {string} options.body - Email content
     * @param {string} [options.description] - Mandatory reasoning/description
     */
    async sendEmail({ to, subject, body, description }) {
        console.log(`%c[EMAIL SENT TO: ${to}]`, 'color: #F97316; font-weight: bold;');
        console.log(`%cSubject: ${subject}`, 'color: #0F172A; font-weight: 600;');
        console.log(`Message: ${body}`);
        if (description) {
            console.log(`%cDescription/Reason: ${description}`, 'font-style: italic; color: #64748B;');
        }
        console.log('-----------------------------------');

        // Show a visual confirmation to the user
        if (window.toast) {
            window.toast.show(`Notification sent to ${to}: ${subject}`, 'info');
        }

        return { success: true, messageId: Math.random().toString(36).substr(2, 9) };
    }

    /**
     * Notify Project Manager about a Budget Uplift Request
     */
    async notifyProjectManagerUplift(projectId, amount, reason) {
        return this.sendEmail({
            to: 'Project Manager',
            subject: `Action Required: Budget Uplift Request for ${projectId}`,
            body: `The Finance Director has requested an additional MWK ${amount.toLocaleString()} for project ${projectId}.`,
            description: reason
        });
    }

    /**
     * Notify Field Supervisor about Requisition Approval/Rejection
     */
    async notifyRequisitionStatus(reqId, status, note) {
        return this.sendEmail({
            to: 'Field Supervisor & EC',
            subject: `Requisition ${reqId}: ${status.toUpperCase()}`,
            body: `Your resource requisition ${reqId} has been ${status.toLowerCase()} by the Finance Director.`,
            description: note
        });
    }
}

export const notificationService = new NotificationService();
