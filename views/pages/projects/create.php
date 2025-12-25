<?php
/**
 * Projects - Create Wizard
 */
$pageTitle = 'Create Project';
$currentPage = 'projects';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="breadcrumb">
        <span>Project Management</span>
        <i class="fas fa-chevron-right"></i>
        <span>Create Project</span>
    </div>
    <div class="header-title">
        <h1>✨ New Project Wizard</h1>
    </div>
</div>

<div class="content">
    <div class="wizard-container">
        <!-- Wizard Steps Indicator -->
        <div class="wizard-steps">
            <div class="step active" data-step="1">
                <div class="step-icon">1</div>
                <div class="step-label">Details</div>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="2">
                <div class="step-icon">2</div>
                <div class="step-label">Timeline</div>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="3">
                <div class="step-icon">3</div>
                <div class="step-label">Budget</div>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="4">
                <div class="step-icon">4</div>
                <div class="step-label">Team</div>
            </div>
        </div>

        <form id="createProjectForm" class="wizard-form" onsubmit="return false;">
            <!-- Step 1: Details -->
            <div class="wizard-step active" id="step1">
                <div class="form-section-title">Project Details</div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Project Name <span class="text-red">*</span></label>
                        <input type="text" name="name" class="form-input" required placeholder="e.g. Skyline Tower">
                    </div>
                    <div class="form-group col-md-6">
                        <label>Project Code <span class="text-red">*</span></label>
                        <input type="text" name="code" class="form-input" required placeholder="e.g. PRJ-2024-001">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" class="form-textarea" rows="4" placeholder="Brief project description..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Location <span class="text-red">*</span></label>
                        <input type="text" name="location" class="form-input" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Type</label>
                        <select name="type" class="form-select">
                            <option value="construction">Construction</option>
                            <option value="renovation">Renovation</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Step 2: Timeline -->
            <div class="wizard-step" id="step2">
                <div class="form-section-title">Timeline & Schedule</div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Start Date <span class="text-red">*</span></label>
                        <input type="date" name="start_date" class="form-input" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Expected End Date <span class="text-red">*</span></label>
                        <input type="date" name="end_date" class="form-input" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" class="form-select">
                        <option value="planning">Planning (Draft)</option>
                        <option value="active">Active (Start Immediately)</option>
                    </select>
                </div>
            </div>

            <!-- Step 3: Budget -->
            <div class="wizard-step" id="step3">
                <div class="form-section-title">Financials</div>
                <div class="form-group">
                    <label>Total Budget (MWK) <span class="text-red">*</span></label>
                    <div class="input-group">
                        <span class="input-prefix">MWK</span>
                        <input type="number" name="budget" class="form-input" required min="0" step="0.01">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Client Name</label>
                        <input type="text" name="client" class="form-input">
                    </div>
                    <div class="form-group col-md-6">
                        <label>Contract Value</label>
                        <input type="number" name="contract_value" class="form-input">
                    </div>
                </div>
            </div>

            <!-- Step 4: Team -->
            <div class="wizard-step" id="step4">
                <div class="form-section-title">Team Assignment</div>
                <div class="form-group">
                    <label>Project Manager <span class="text-red">*</span></label>
                    <select name="manager_id" class="form-select" required>
                        <option value="">Select Manager</option>
                        <?php foreach($managers ?? [] as $m): ?>
                            <option value="<?= $m['id'] ?>"><?= $m['first_name'] . ' ' . $m['last_name'] ?></option>
                        <?php endforeach; ?>
                        <!-- Fallback for dev if no PHP data -->
                        <option value="1">John Doe (Senior PM)</option>
                        <option value="2">Jane Smith</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Site Supervisor</label>
                    <input type="text" name="supervisor" class="form-input" placeholder="Name">
                </div>
            </div>

            <!-- Navigation Actions -->
            <div class="wizard-actions">
                <button type="button" class="btn btn-secondary" id="prevBtn" onclick="changeStep(-1)" disabled>Previous</button>
                <button type="button" class="btn btn-primary" id="nextBtn" onclick="changeStep(1)">Next</button>
                <button type="button" class="btn btn-success" id="submitBtn" onclick="submitWizard()" style="display:none;">Create Project</button>
            </div>
        </form>
    </div>
</div>

<style>
/* Wizard Styles */
.wizard-container {
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.wizard-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    position: relative;
    padding: 0 1rem;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
    position: relative;
    opacity: 0.6;
    transition: all 0.3s ease;
}

.step.active {
    opacity: 1;
}

.step-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--slate-100);
    color: var(--slate-500);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 0.5rem;
    border: 2px solid var(--slate-200);
    transition: all 0.3s ease;
}

.step.active .step-icon {
    background: var(--orange);
    color: white;
    border-color: var(--orange);
}

.step-label {
    font-size: 0.875rem;
    font-weight: 500;
}

.step-line {
    flex: 1;
    height: 2px;
    background: var(--slate-200);
    margin: 0 10px;
    position: relative;
    top: -15px;
    z-index: 1;
}

.wizard-step {
    display: none;
    animation: fadeIn 0.4s ease;
}

.wizard-step.active {
    display: block;
}

.wizard-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--slate-100);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

<script>
let currentStep = 1;
const totalSteps = 4;

function changeStep(direction) {
    if (direction === 1 && !validateStep(currentStep)) return;
    
    currentStep += direction;
    updateWizard();
}

function updateWizard() {
    // Show/Hide Steps
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + currentStep).classList.add('active');

    // Update Indicators
    document.querySelectorAll('.step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        if (stepNum <= currentStep) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Update Buttons
    document.getElementById('prevBtn').disabled = currentStep === 1;
    
    if (currentStep === totalSteps) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'block';
    } else {
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

function validateStep(step) {
    const stepEl = document.getElementById('step' + step);
    const inputs = stepEl.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('error'); // Ensure CSS handles .error class
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    if (!isValid) AlertsComponent?.error('Please fill in all required fields.');
    return isValid;
}

async function submitWizard() {
    if (!validateStep(currentStep)) return;
    
    const form = document.getElementById('createProjectForm');
    const formData = new FormData(form);
    const btn = document.getElementById('submitBtn');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const response = await fetch("<?php echo BASE_URL; ?>/api/v1/projects", {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Project Initialized Successfully!');
            setTimeout(() => window.location.href = "<?php echo BASE_URL; ?>/projects/" + data.id, 1000);
        } else {
            AlertsComponent?.error(data.message || 'Creation failed');
            btn.disabled = false;
            btn.textContent = 'Create Project';
        }
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Server Error');
        btn.disabled = false;
        btn.textContent = 'Create Project';
    }
}
</script>
