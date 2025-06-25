<?php
/**
 * Admin menu functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Admin_Menu {
    
    public function __construct() {
        // Debug: Check if constructor is called
        add_action('admin_notices', function() {
            //echo '<div class="notice notice-info"><p>🔵 PFCT_Admin_Menu constructor called!</p></div>';
        });
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    /**
     * Add admin menu items
     */
    public function add_admin_menu() {
        // Debug: Check if add_admin_menu is called
        add_action('admin_notices', function() {
            //echo '<div class="notice notice-success"><p>✅ add_admin_menu() function called!</p></div>';
        });
        
        $page = add_options_page(
            'PropFirm Emails',
            'PropFirm Emails',
            'manage_options',
            'pfct-emails',
            array($this, 'admin_page')
        );
        
        // Debug: Check if page was created
        if ($page) {
            add_action('admin_notices', function() use ($page) {
                //echo '<div class="notice notice-success"><p>✅ Menu page created successfully! Hook: ' . $page . '</p></div>';
            });
        } else {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>❌ Failed to create menu page!</p></div>';
            });
        }
    }
    
    /**
     * Display admin page
     */
    public function admin_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'pfct_emails';
        
        // Handle bulk actions if any
        $this->handle_bulk_actions();
        
        $emails = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC");
        
        include PFCT_PLUGIN_PATH . 'admin/partials/admin-display.php';
    }
    
    /**
     * Handle bulk actions
     */
    private function handle_bulk_actions() {
        if (isset($_POST['action']) && $_POST['action'] === 'delete_selected') {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'bulk-emails')) {
                wp_die('Security check failed');
            }
            
            if (isset($_POST['email_ids']) && is_array($_POST['email_ids'])) {
                global $wpdb;
                $table_name = $wpdb->prefix . 'pfct_emails';
                
                $ids = array_map('intval', $_POST['email_ids']);
                $placeholders = implode(',', array_fill(0, count($ids), '%d'));
                
                $wpdb->query($wpdb->prepare(
                    "DELETE FROM $table_name WHERE id IN ($placeholders)",
                    $ids
                ));
                
                add_action('admin_notices', function() {
                    echo '<div class="notice notice-success"><p>Selected emails deleted successfully.</p></div>';
                });
            }
        }
    }
    
    /**
     * Export emails to CSV
     */
    public function export_emails() {
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
}
?>
