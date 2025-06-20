<?php
/**
 * Admin-specific functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Admin {
    
    public function __construct() {
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('admin_init', array($this, 'handle_admin_actions'));
    }
    
    /**
     * Enqueue admin styles and scripts
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our admin page
        if ($hook !== 'settings_page_pfct-emails') {
            return;
        }
        
        wp_enqueue_style(
            'pfct-admin-styles', 
            PFCT_PLUGIN_URL . 'assets/css/admin-style.css', 
            array(), 
            PFCT_VERSION
        );
        
        wp_enqueue_script(
            'pfct-admin-script', 
            PFCT_PLUGIN_URL . 'assets/js/admin-script.js', 
            array('jquery'), 
            PFCT_VERSION, 
            true
        );
        
        // Localize script for admin AJAX
        wp_localize_script('pfct-admin-script', 'pfct_admin_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pfct_admin_nonce')
        ));
    }
    
    /**
     * Handle admin actions
     */
    public function handle_admin_actions() {
        if (!isset($_GET['page']) || $_GET['page'] !== 'pfct-emails') {
            return;
        }
        
        // Handle export action
        if (isset($_GET['action']) && $_GET['action'] === 'export') {
            $this->export_emails();
        }
        
        // Handle single email deletion
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
            $this->delete_single_email();
        }
    }
    
    /**
     * Export emails to CSV
     */
    private function export_emails() {
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'pfct_emails';
        $emails = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC");
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="propfirm-emails-' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, array('ID', 'Email', 'Date Subscribed'));
        
        foreach ($emails as $email) {
            fputcsv($output, array(
                $email->id,
                $email->email,
                $email->created_at
            ));
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Delete a single email
     */
    private function delete_single_email() {
        $id = intval($_GET['id']);
        
        if (!wp_verify_nonce($_GET['_wpnonce'], 'delete_email_' . $id)) {
            wp_die('Security check failed');
        }
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'pfct_emails';
        
        $result = $wpdb->delete($table_name, array('id' => $id), array('%d'));
        
        if ($result) {
            wp_redirect(admin_url('admin.php?page=pfct-emails&deleted=1'));
        } else {
            wp_redirect(admin_url('admin.php?page=pfct-emails&error=1'));
        }
        exit;
    }
}
?>