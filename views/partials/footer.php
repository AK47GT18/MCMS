<?php
/**
 * Footer Partial
 * Displays application footer with links and information
 * Usage: <?php include 'partials/footer.php'; ?>
 */
$currentYear = date('Y');
?>

<footer class="app-footer">
    <div class="footer-content">
        <div class="footer-section">
            <h4 class="footer-title">MCMS</h4>
            <p class="footer-description">Construction Management System for the Ministry of Transport and Public Works</p>
            <div class="footer-social">
                <a href="#" class="social-link" title="Email"><span class="icon">✉</span></a>
                <a href="#" class="social-link" title="Phone"><span class="icon">☎</span></a>
            </div>
        </div>

        <div class="footer-section">
            <h4 class="footer-title">Quick Links</h4>
            <ul class="footer-links">
                <li><a href="<?php echo BASE_URL; ?>/dashboard">Dashboard</a></li>
                <li><a href="<?php echo BASE_URL; ?>/projects">Projects</a></li>
                <li><a href="<?php echo BASE_URL; ?>/equipment">Equipment</a></li>
                <li><a href="<?php echo BASE_URL; ?>/finance">Finance</a></li>
            </ul>
        </div>

        <div class="footer-section">
            <h4 class="footer-title">Support</h4>
            <ul class="footer-links">
                <li><a href="<?php echo BASE_URL; ?>/help">Help Center</a></li>
                <li><a href="<?php echo BASE_URL; ?>/documentation">Documentation</a></li>
                <li><a href="<?php echo BASE_URL; ?>/contact">Contact Us</a></li>
                <li><a href="<?php echo BASE_URL; ?>/settings">Settings</a></li>
            </ul>
        </div>

        <div class="footer-section">
            <h4 class="footer-title">Legal</h4>
            <ul class="footer-links">
                <li><a href="<?php echo BASE_URL; ?>/privacy">Privacy Policy</a></li>
                <li><a href="<?php echo BASE_URL; ?>/terms">Terms of Service</a></li>
                <li><a href="<?php echo BASE_URL; ?>/security">Security</a></li>
            </ul>
        </div>
    </div>

    <div class="footer-bottom">
        <div class="footer-left">
            <p>&copy; <?php echo $currentYear; ?> Ministry of Transport and Public Works. All rights reserved.</p>
        </div>
        <div class="footer-right">
            <p class="version">Version 1.0.0 | Status: <span class="status-indicator online">Online</span></p>
        </div>
    </div>
</footer>
