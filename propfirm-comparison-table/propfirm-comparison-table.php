<?php
/**
 * Plugin Name: PropFirm Comparison Table
 * Description: Automated comparison table for prop firm offers with email capture.
 * Version: 1.2
 * Author: Your Name
 * Text Domain: propfirm-comparison
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PFCT_VERSION', '1.2');
define('PFCT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PFCT_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('PFCT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Include required files
require_once PFCT_PLUGIN_PATH . 'includes/class-pfct-activator.php';
require_once PFCT_PLUGIN_PATH . 'includes/class-pfct-deactivator.php';
require_once PFCT_PLUGIN_PATH . 'includes/class-pfct-ajax.php';
require_once PFCT_PLUGIN_PATH . 'public/class-pfct-public.php';
require_once PFCT_PLUGIN_PATH . 'public/class-pfct-shortcode.php';

// Include admin files only in admin area
if (is_admin()) {
    require_once PFCT_PLUGIN_PATH . 'admin/class-pfct-admin-menu.php';
    require_once PFCT_PLUGIN_PATH . 'includes/class-pfct-admin.php';
}

// Plugin activation hook
register_activation_hook(__FILE__, array('PFCT_Activator', 'activate'));

// Plugin deactivation hook
register_deactivation_hook(__FILE__, array('PFCT_Deactivator', 'deactivate'));

// Initialize the plugin
function pfct_init() {
    // Debug: Check if pfct_init is called
    add_action('admin_notices', function() {
        echo '<div class="notice notice-warning"><p>🟡 pfct_init() function called!</p></div>';
    });
    
    // Load text domain for translations
    load_plugin_textdomain('propfirm-comparison', false, dirname(PFCT_PLUGIN_BASENAME) . '/languages/');
    
    // Initialize classes
    new PFCT_Public();
    new PFCT_Shortcode();
    new PFCT_Ajax();
    
    if (is_admin()) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-info"><p>🔵 Creating admin classes...</p></div>';
        });
        new PFCT_Admin_Menu();
        new PFCT_Admin();
    }
}
add_action('plugins_loaded', 'pfct_init');

// Add test line for debugging
add_action('wp_footer', function() { 
    echo '<!-- PropFirm Plugin Test -->'; 
});
