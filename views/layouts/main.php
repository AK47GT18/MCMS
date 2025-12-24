<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="MCMS - Construction Management System">
    <title><?php echo isset($title) ? htmlspecialchars($title) . ' - MCMS' : 'MCMS'; ?></title>
    <link rel="manifest" href="/MCMS/public/manifest.json">
    <link rel="icon" type="image/png" href="/MCMS/public/favicon.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/MCMS/public/css/main.css">
    <?php if (isset($additionalCSS) && is_array($additionalCSS)): ?>
        <?php foreach ($additionalCSS as $css): ?>
            <link rel="stylesheet" href="<?php echo htmlspecialchars($css); ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <div class="main-layout">
        <?php include __DIR__ . '/../partials/sidebar.php'; ?>
        
        <header class="header">
            <?php include __DIR__ . '/../partials/header.php'; ?>
        </header>
        
        <main class="main-content">
            <?php if (isset($breadcrumbs)): ?>
                <?php include __DIR__ . '/../partials/breadcrumb.php'; ?>
            <?php endif; ?>
            
            <?php echo isset($content) ? $content : ''; ?>
        </main>
    </div>

    <div id="notification-container"></div>
    
    <script src="/MCMS/public/js/core/config.js"></script>
    <script src="/MCMS/public/js/core/ajax-handler.js"></script>
    <script src="/MCMS/public/js/core/auth.js"></script>
    <script src="/MCMS/public/js/core/modal-manager.js"></script>
    <script src="/MCMS/public/js/core/router.js"></script>
    
    <script src="/MCMS/public/js/components/notifications.js"></script>
    <script src="/MCMS/public/js/components/calendar.js"></script>
    <script src="/MCMS/public/js/components/charts.js"></script>
    <script src="/MCMS/public/js/components/data-tables.js"></script>
    <script src="/MCMS/public/js/components/modals.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    
    <script src="/MCMS/public/js/services/api.js"></script>
    <script src="/MCMS/public/js/services/notifications.js"></script>
    <script src="/MCMS/public/js/services/gps.js"></script>
    <script src="/MCMS/public/js/services/offline.js"></script>
    <script src="/MCMS/public/js/services/sync.js"></script>
    
    <script src="/MCMS/public/js/modules/dashboard.js"></script>
    <script src="/MCMS/public/js/modules/projects.js"></script>
    <script src="/MCMS/public/js/modules/contracts.js"></script>
    <script src="/MCMS/public/js/modules/equipment.js"></script>
    <script src="/MCMS/public/js/modules/finance.js"></script>
    <script src="/MCMS/public/js/modules/reports.js"></script>
    
    <script src="/MCMS/public/js/utils/formatter.js"></script>
    <script src="/MCMS/public/js/utils/helpers.js"></script>
    <script src="/MCMS/public/js/utils/storage.js"></script>
    <script src="/MCMS/public/js/utils/validation.js"></script>
    
    <script src="/MCMS/public/js/core/app.js"></script>
    <script src="/MCMS/public/js/main.js"></script>

    <?php if (isset($pageInit)): ?>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                <?php echo $pageInit; ?>
            });
        </script>
    <?php endif; ?>

    <?php if (isset($additionalJS) && is_array($additionalJS)): ?>
        <?php foreach ($additionalJS as $js): ?>
            <script src="<?php echo htmlspecialchars($js); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>

    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/MCMS/public/service-worker.js').catch(err => console.log('SW registration failed:', err));
        }
    </script>
</body>
</html>
