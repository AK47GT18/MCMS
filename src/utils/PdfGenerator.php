<?php
/**
 * PDF Generator Utility
 * 
 * @file PdfGenerator.php
 * @description Generate PDF reports (FR-19, FR-20)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

namespace Mkaka\Utils;

class PdfGenerator {
    
    /**
     * Generate project status report PDF (FR-19)
     */
    public static function generateProjectReport($projectData, $outputPath = null) {
        // This would use a library like TCPDF or FPDF
        // For demonstration, returning array structure
        
        $html = self::buildProjectReportHtml($projectData);
        
        if ($outputPath) {
            // Save to file
            file_put_contents($outputPath, $html);
            return $outputPath;
        }
        
        return $html;
    }
    
    /**
     * Generate financial report PDF (FR-20)
     */
    public static function generateFinancialReport($transactionData, $outputPath = null) {
        $html = self::buildFinancialReportHtml($transactionData);
        
        if ($outputPath) {
            file_put_contents($outputPath, $html);
            return $outputPath;
        }
        
        return $html;
    }
    
    /**
     * Build project report HTML
     */
    private static function buildProjectReportHtml($data) {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
        $html .= '<style>body{font-family:Arial,sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;}</style>';
        $html .= '</head><body>';
        $html .= '<h1>Project Status Report</h1>';
        $html .= '<h2>' . htmlspecialchars($data['project']['project_name']) . '</h2>';
        $html .= '<p>Report Generated: ' . date('d/m/Y H:i') . '</p>';
        $html .= '<table><tr><th>Metric</th><th>Value</th></tr>';
        $html .= '<tr><td>Completion</td><td>' . $data['completion']['percentage'] . '%</td></tr>';
        $html .= '<tr><td>Budget Used</td><td>' . $data['budget']['percentage'] . '%</td></tr>';
        $html .= '</table>';
        $html .= '</body></html>';
        
        return $html;
    }
    
    /**
     * Build financial report HTML
     */
    private static function buildFinancialReportHtml($data) {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
        $html .= '<style>body{font-family:Arial,sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style>';
        $html .= '</head><body>';
        $html .= '<h1>Financial Report</h1>';
        $html .= '<p>Generated: ' . date('d/m/Y H:i') . '</p>';
        $html .= '<table><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>';
        
        foreach ($data as $transaction) {
            $html .= '<tr>';
            $html .= '<td>' . date('d/m/Y', strtotime($transaction['created_at'])) . '</td>';
            $html .= '<td>' . htmlspecialchars($transaction['description']) . '</td>';
            $html .= '<td>MK ' . number_format($transaction['amount'], 2) . '</td>';
            $html .= '<td>' . htmlspecialchars($transaction['status']) . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</table></body></html>';
        
        return $html;
    }
}