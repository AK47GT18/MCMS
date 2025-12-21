<?php
class ExcelExporter {
    
    /**
     * Export data to CSV (Excel compatible)
     */
    public static function exportToCsv($data, $headers, $filename) {
        $output = fopen('php://temp', 'w');
        
        // Write headers
        fputcsv($output, $headers);
        
        // Write data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        // Output or save
        if ($filename) {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo $csv;
            exit;
        }
        
        return $csv;
    }
    
    /**
     * Export financial report
     */
    public static function exportFinancialReport($transactions, $filename = null) {
        $headers = ['Date', 'Transaction Code', 'Description', 'Amount', 'Status', 'Vendor'];
        
        $data = [];
        foreach ($transactions as $t) {
            $data[] = [
                date('d/m/Y', strtotime($t['created_at'])),
                $t['transaction_code'],
                $t['description'],
                number_format($t['amount'], 2),
                $t['status'],
                $t['vendor_name']
            ];
        }
        
        return self::exportToCsv($data, $headers, $filename ?: 'financial_report_' . date('Ymd') . '.csv');
    }
    
    /**
     * Export project report
     */
    public static function exportProjectReport($projects, $filename = null) {
        $headers = ['Project Code', 'Name', 'Client', 'Status', 'Completion %', 'Budget', 'Manager'];
        
        $data = [];
        foreach ($projects as $p) {
            $data[] = [
                $p['project_code'],
                $p['project_name'],
                $p['client_name'],
                $p['status'],
                $p['completion_percentage'] . '%',
                number_format($p['contract_value'], 2),
                $p['manager_name'] ?? 'N/A'
            ];
        }
        
        return self::exportToCsv($data, $headers, $filename ?: 'projects_' . date('Ymd') . '.csv');
    }
}
