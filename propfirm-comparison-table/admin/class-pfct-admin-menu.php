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
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    /**
     * Add admin menu items
     */
    public function add_admin_menu() {
        add_options_page(
            'PropFirm Settings',
            'PropFirm Settings',
            'manage_options',
            'pfct-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Display admin page
     */
    public function admin_page() {
        include PFCT_PLUGIN_PATH . 'admin/partials/admin-display.php';
    }
}
?>
