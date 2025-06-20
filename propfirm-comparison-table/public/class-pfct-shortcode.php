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
            'title' => 'PropFirm Comparison Table',
            'button_text' => 'Submit'
        ), $atts);

        ob_start();
        ?>
        <div id="pfct-wrapper" class="pfct-wrapper">
            <?php echo $this->render_email_capture($atts); ?>
            <?php echo $this->render_table_container(); ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render email capture form
     */
    private function render_email_capture($atts) {
        ob_start();
        ?>
        <div id="pfct-email-capture" class="pfct-email-capture">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            <form id="pfct-email-form" class="pfct-email-form">
                <?php wp_nonce_field('pfct_email_nonce', 'pfct_nonce'); ?>
                <div class="pfct-form-group">
                    <label for="pfct-email">Enter your email to see the comparison table:</label>
                    <input type="email" id="pfct-email" name="email" required placeholder="your@email.com">
                </div>
                <button type="submit" class="pfct-submit-btn"><?php echo esc_html($atts['button_text']); ?></button>
                <div id="pfct-loading" class="pfct-loading" style="display:none;">
                    <span>Processing...</span>
                </div>
                <div id="pfct-error" class="pfct-error" style="display:none;"></div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render table container
     */
    private function render_table_container() {
        ob_start();
        ?>
        <div id="pfct-table-container" class="pfct-table-container" style="display:none;">
            <div class="pfct-table-header">
                <h3>PropFirm Comparison</h3>
                <p>Here are the latest prop firm offers and their details:</p>
            </div>
            <div id="pfct-table-content" class="pfct-table-content">
                <div class="pfct-loading-table">Loading comparison data...</div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Get hardcoded table data (for fallback)
     */
    public function get_table_html() {
        ob_start();
        ?>
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
        <?php
        return ob_get_clean();
    }
}
?>