<?php
/**
 * Plugin Name: PropFirm Comparison Table
 * Description: Automated comparison table for prop firm offers with email capture.
 * Version: 1.2
 * Author: Your Name
 * Text Domain: propfirm-comparison
 */
// Add this test line right here:
add_action('wp_footer', function() { echo '<!-- PropFirm Plugin Test -->'; });

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PFCT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PFCT_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Plugin activation hook - create table
register_activation_hook(__FILE__, 'pfct_create_table');

function pfct_create_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'pfct_emails';

    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        email varchar(100) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Enqueue styles and scripts
function pfct_enqueue_scripts() {
    wp_enqueue_style('pfct-styles', PFCT_PLUGIN_URL . 'assets/style.css', array(), '1.0');
    wp_enqueue_script('pfct-script', PFCT_PLUGIN_URL . 'assets/script.js', array('jquery'), '1.0', true);
    
    // Localize script for AJAX
    wp_localize_script('pfct-script', 'pfct_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('pfct_email_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'pfct_enqueue_scripts');

// Register shortcode to display comparison table
function pfct_comparison_table_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => 'PropFirm Comparison Table',
        'button_text' => 'Submit'
    ), $atts);

    ob_start();
    ?>
    <div id="pfct-wrapper" class="pfct-wrapper">
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
        
        <div id="pfct-table-container" class="pfct-table-container" style="display:none;">
            <div class="pfct-table-header">
                <h3>PropFirm Comparison</h3>
                <p>Here are the latest prop firm offers and their details:</p>
            </div>
            <div id="pfct-table-content" class="pfct-table-content">
                <div class="pfct-loading-table">Loading comparison data...</div>
            </div>
        </div>
    </div>

    <style>
    .pfct-wrapper {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    }
    .pfct-email-capture {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #ddd;
    }
    .pfct-email-capture h3 {
        margin-bottom: 20px;
        color: #333;
    }
    .pfct-form-group {
        margin-bottom: 20px;
    }
    .pfct-form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: #555;
    }
    .pfct-form-group input[type="email"] {
        width: 100%;
        max-width: 300px;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
    }
    .pfct-submit-btn {
        background: #0073aa;
        color: white;
        padding: 12px 30px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
    }
    .pfct-submit-btn:hover {
        background: #005a87;
    }
    .pfct-submit-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    .pfct-loading {
        margin-top: 10px;
        color: #666;
    }
    .pfct-error {
        margin-top: 10px;
        color: #d63638;
        font-weight: bold;
    }
    .pfct-table-container {
        margin-top: 20px;
    }
    .pfct-table-header {
        text-align: center;
        margin-bottom: 20px;
    }
    .pfct-comparison-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .pfct-comparison-table th,
    .pfct-comparison-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    .pfct-comparison-table th {
        background: #f1f1f1;
        font-weight: bold;
        color: #333;
    }
    .pfct-comparison-table tr:hover {
        background: #f9f9f9;
    }
    .pfct-trustpilot-score {
        font-weight: bold;
        color: #00b67a;
    }
    .pfct-price {
        font-weight: bold;
        color: #0073aa;
    }
    </style>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('pfct-email-form');
        const emailInput = document.getElementById('pfct-email');
        const submitBtn = form.querySelector('.pfct-submit-btn');
        const loadingDiv = document.getElementById('pfct-loading');
        const errorDiv = document.getElementById('pfct-error');
        const emailCapture = document.getElementById('pfct-email-capture');
        const tableContainer = document.getElementById('pfct-table-container');
        const tableContent = document.getElementById('pfct-table-content');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const nonce = document.getElementById('pfct_nonce').value;
            
            if (!email) {
                showError('Please enter a valid email address.');
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';

            try {
                const response = await fetch(pfct_ajax.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'pfct_save_email',
                        email: email,
                        nonce: nonce
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Hide email form and show table
                    emailCapture.style.display = 'none';
                    tableContainer.style.display = 'block';
                    
                    // Load table data
                    loadTableData();
                } else {
                    showError(data.data || 'Failed to save email. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('An error occurred. Please try again.');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = '<?php echo esc_js($atts['button_text']); ?>';
                loadingDiv.style.display = 'none';
            }
        });

        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function loadTableData() {
            // In a real implementation, this would fetch live data
            const tableHTML = `
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
            `;
            
            tableContent.innerHTML = tableHTML;
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('pfct_comparison_table', 'pfct_comparison_table_shortcode');

// Save email to database using AJAX
function pfct_save_email_ajax() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'pfct_email_nonce')) {
        wp_send_json_error('Security check failed');
        return;
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'pfct_emails';

    $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
    
    if (!is_email($email)) {
        wp_send_json_error('Please enter a valid email address');
        return;
    }

    // Check if email already exists
    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table_name WHERE email = %s",
        $email
    ));

    if ($existing) {
        wp_send_json_success('Email already registered - showing table');
        return;
    }

    // Insert new email
    $result = $wpdb->insert(
        $table_name,
        array(
            'email' => $email,
            'created_at' => current_time('mysql')
        ),
        array('%s', '%s')
    );

    if ($result === false) {
        error_log('PFCT Plugin: Failed to insert email - ' . $wpdb->last_error);
        wp_send_json_error('Failed to save email. Please try again.');
        return;
    }

    wp_send_json_success('Email saved successfully');
}
add_action('wp_ajax_pfct_save_email', 'pfct_save_email_ajax');
add_action('wp_ajax_nopriv_pfct_save_email', 'pfct_save_email_ajax');

// Admin menu for viewing collected emails
function pfct_add_admin_menu() {
    add_options_page(
        'PropFirm Emails',
        'PropFirm Emails',
        'manage_options',
        'pfct-emails',
        'pfct_admin_page'
    );
}
add_action('admin_menu', 'pfct_add_admin_menu');

function pfct_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'pfct_emails';
    
    $emails = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC");
    ?>
    <div class="wrap">
        <h1>PropFirm Comparison - Email Subscribers</h1>
        <p>Total subscribers: <?php echo count($emails); ?></p>
        
        <?php if ($emails): ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Date Subscribed</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($emails as $email): ?>
                <tr>
                    <td><?php echo esc_html($email->id); ?></td>
                    <td><?php echo esc_html($email->email); ?></td>
                    <td><?php echo esc_html($email->created_at); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php else: ?>
        <p>No email subscribers yet.</p>
        <?php endif; ?>
    </div>
    <?php
}

// Plugin deactivation cleanup
register_deactivation_hook(__FILE__, 'pfct_deactivation');

function pfct_deactivation() {
    // Optionally clean up data on deactivation
    // Uncomment the lines below if you want to remove the table on deactivation
    /*
    global $wpdb;
    $table_name = $wpdb->prefix . 'pfct_emails';
    $wpdb->query("DROP TABLE IF EXISTS $table_name");
    */
}
?>