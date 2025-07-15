<?php
/**
 * Shortcode functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Shortcode {
    
    public function __construct() {
        add_shortcode('pfct_comparison_table', array($this, 'render_shortcode'));
    }
    
    /**
     * Render the comparison table shortcode
     */
    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => 'Prop Firm Comparison Table'
        ), $atts);

        ob_start();
        ?>
        <div id="pfct-wrapper" class="pfct-wrapper">
            <?php echo $this->render_table_container($atts); ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render table container
     */
    private function render_table_container($atts) {
        ob_start();
        ?>
        <div id="pfct-table-container" class="pfct-table-container">
            <div class="pfct-table-header">
                <h3><?php echo esc_html($atts['title']); ?></h3>
                <p>Here are the latest prop firm deals and their details:</p>
            </div>
            <div id="pfct-table-content" class="pfct-table-content">
                <?php echo $this->get_table_html(); ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Get hardcoded table data
     */
    public function get_table_html() {
        ob_start();
        ?>
        <div class="pfct-search-filter">
            <h4>Search & Filter Results</h4>
            <input type="text" id="pfct-search" placeholder="Search businesses, plans, account types..." class="pfct-search-input">
        </div>
        
        <table class="pfct-comparison-table">
            <thead>
                <tr>
                    <th>Business Name</th>
                    <th>Account Size</th>
                    <th>Sale Price</th>
                    <th>Trustpilot Score</th>
                    <th>Profit Target</th>
                    <th>Max Drawdown</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>FTMO</strong></td>
                    <td>$100,000</td>
                    <td class="pfct-price">$540</td>
                    <td class="pfct-trustpilot-score">4.1 ⭐</td>
                    <td>10%</td>
                    <td>10%</td>
                </tr>
                <tr>
                    <td><strong>Apex Trader Funding</strong></td>
                    <td>$100,000</td>
                    <td class="pfct-price">$157</td>
                    <td class="pfct-trustpilot-score">4.7 ⭐</td>
                    <td>8%</td>
                    <td>4%</td>
                </tr>
                <tr>
                    <td><strong>TopstepTrader</strong></td>
                    <td>$100,000</td>
                    <td class="pfct-price">$165</td>
                    <td class="pfct-trustpilot-score">3.8 ⭐</td>
                    <td>6%</td>
                    <td>3%</td>
                </tr>
                <tr>
                    <td><strong>The5%ers</strong></td>
                    <td>$100,000</td>
                    <td class="pfct-price">$230</td>
                    <td class="pfct-trustpilot-score">4.2 ⭐</td>
                    <td>8%</td>
                    <td>4%</td>
                </tr>
                <tr>
                    <td><strong>My Forex Funds</strong></td>
                    <td>$100,000</td>
                    <td class="pfct-price">$379</td>
                    <td class="pfct-trustpilot-score">4.5 ⭐</td>
                    <td>10%</td>
                    <td>5%</td>
                </tr>
            </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
            <p>* Prices and terms are subject to change. Please verify directly with each provider.</p>
            <p>Last updated: <?php echo date('F j, Y'); ?></p>
        </div>

        <style>
        .pfct-wrapper {
            max-width: 100%;
            margin: 20px 0;
        }
        .pfct-table-header h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .pfct-search-filter {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
        }
        .pfct-search-filter h4 {
            margin: 0 0 10px 0;
            color: #555;
        }
        .pfct-search-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        .pfct-comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .pfct-comparison-table th,
        .pfct-comparison-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .pfct-comparison-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .pfct-comparison-table tbody tr:hover {
            background-color: #f5f5f5;
        }
        .pfct-price {
            font-weight: bold;
            color: #007cba;
        }
        .pfct-trustpilot-score {
            color: #00b67a;
        }
        </style>

        <script>
        document.getElementById('pfct-search').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.pfct-comparison-table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }
}
?>
