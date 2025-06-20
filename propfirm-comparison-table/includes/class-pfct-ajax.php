<?php
/**
 * AJAX functionality for the plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Ajax {
    
    public function __construct() {
        add_action('wp_ajax_pfct_save_email', array($this, 'save_email'));
        add_action('wp_ajax_nopriv_pfct_save_email', array($this, 'save_email'));
    }
    
    /**
     * Save email to database via AJAX
     */
    public function save_email() {
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

        // Hook for other plugins or custom actions
        do_action('pfct_email_saved', $email);

        wp_send_json_success('Email saved successfully');
    }
    
    /**
     * Get comparison table data (for future API integration)
     */
    public function get_table_data() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pfct_table_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }
        
        // This would fetch live data from APIs in a real implementation
        $data = $this->get_propfirm_data();
        
        wp_send_json_success($data);
    }
    
    /**
     * Get propfirm data (placeholder for API integration)
     */
    private function get_propfirm_data() {
        // This would be replaced with actual API calls
        return array(
            array(
                'name' => 'FTMO',
                'account_size' => '$100,000',
                'price' => '$540',
                'trustpilot' => '4.1',
                'profit_target' => '10%',
                'max_drawdown' => '10%'
            ),
            array(
                'name' => 'Apex Trader Funding',
                'account_size' => '$100,000',
                'price' => '$157',
                'trustpilot' => '4.7',
                'profit_target' => '8%',
                'max_drawdown' => '4%'
            ),
            // Add more data as needed
        );
    }
}
?>