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
    <link rel="stylesheet" href="/MCMS/public/css/main.css">
</head>
<body>
    <div class="auth-wrapper">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="auth-logo">
                        <i class="fas fa-road"></i>
                    </div>
                    <h1 class="auth-title">MCMS</h1>
                    <p class="auth-subtitle">Construction Management System</p>
                </div>
                <div class="auth-content">
                    <?php echo isset($content) ? $content : ''; ?>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</body>
</html>
