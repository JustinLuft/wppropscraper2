<?php
/**
 * Admin page display template
 */
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap">
    <h1>PropFirm Comparison Table</h1>
    
    <div class="pfct-admin-content">
        <div class="pfct-info-box">
            <h2>Plugin Information</h2>
            <p>Use the shortcode <code>[pfct_comparison_table]</code> to display the comparison table on any page or post.</p>
            <p>The table automatically loads data from your CSV source and displays a fully interactive comparison table with filtering, sorting, and pagination.</p>
        </div>
        
        <div class="pfct-features-section">
            <h2>Features</h2>
            <ul>
                <li><strong>Search & Filter:</strong> Users can search and filter by business name, account size, price, and ratings</li>
                <li><strong>Sorting:</strong> Sortable columns for price, business name, account size, profit goal, and Trustpilot score</li>
                <li><strong>Pagination:</strong> Loads 15 results at a time with "Load More" functionality</li>
                <li><strong>Responsive Design:</strong> Horizontal scrolling for mobile devices</li>
                <li><strong>Auto-Update:</strong> Data refreshes from your CSV source automatically</li>
            </ul>
        </div>
        
        <div class="pfct-usage-section">
            <h2>Usage</h2>
            <p>Simply add the shortcode <code>[pfct_comparison_table]</code> to any page or post where you want the table to appear.</p>
            <p>The table will automatically load and display your PropFirm comparison data with all interactive features enabled.</p>
        </div>
    </div>
    
    <style>
    .pfct-admin-content {
        max-width: 800px;
    }
    .pfct-info-box {
        background: #e7f3ff;
        border: 1px solid #72aee6;
        padding: 20px;
        border-radius: 4px;
        margin: 20px 0;
    }
    .pfct-info-box h2 {
        margin-top: 0;
        color: #0073aa;
    }
    .pfct-info-box code {
        background: #fff;
        padding: 4px 8px;
        border-radius: 3px;
        font-family: monospace;
    }
    .pfct-features-section, .pfct-usage-section {
        background: #fff;
        border: 1px solid #ccd0d4;
        padding: 20px;
        border-radius: 4px;
        margin: 20px 0;
    }
    .pfct-features-section h2, .pfct-usage-section h2 {
        margin-top: 0;
        color: #333;
    }
    .pfct-features-section ul {
        margin: 0;
        padding-left: 20px;
    }
    .pfct-features-section li {
        margin-bottom: 8px;
    }
    </style>
</div>
