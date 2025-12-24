<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($title) ? htmlspecialchars($title) : 'Print'; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/MCMS/public/css/main.css">
    <style>
        @media print {
            body {
                padding: 0;
            }
            .print-container {
                box-shadow: none;
                max-width: 100%;
                height: auto;
                padding: 0;
                margin: 0;
            }
            .no-print, button, [onclick] {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="print-container">
        <div class="print-header">
            <h1>MCMS</h1>
            <p>Construction Management System Report</p>
            <p style="margin-top: 10px; font-size: 11px;">Generated: <?php echo date('d M Y H:i:s'); ?></p>
        </div>

        <?php if (isset($pageTitle)): ?>
        <h2 class="print-title"><?php echo htmlspecialchars($pageTitle); ?></h2>
        <?php endif; ?>

        <?php echo isset($content) ? $content : ''; ?>

        <div class="print-footer">
            <p>&copy; 2024 Ministry of Transport and Public Works. All rights reserved.</p>
            <p style="margin-top: 10px;">This document was generated automatically by MCMS.</p>
        </div>
    </div>

    <script>
        window.addEventListener('load', function() {
            setTimeout(() => {
                window.print();
            }, 500);
        });
    </script>
</body>
</html>
