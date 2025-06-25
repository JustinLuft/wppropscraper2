<?php
/**
 * Plugin Name: PropFirm Comparison Table (Debug)
 * Description: Debug version to find installation issues
 * Version: 1.2-debug
 * Author: Your Name
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Debug function to log messages
function pfct_debug_log($message) {
    if (WP_DEBUG === true) {
        error_log('PFCT DEBUG: ' . $message);
        // Also show in admin if we can
        add_action('admin_notices', function() use ($message) {
            echo '<div class="notice notice-info"><p><strong>PFCT Debug:</strong> ' . esc_html($message) . '</p></div>';
        });
    }
}

// Log that plugin file is being loaded
pfct_debug_log('Plugin main file loaded');

// Define plugin constants
define('PFCT_VERSION', '1.2');
define('PFCT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PFCT_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('PFCT_PLUGIN_BASENAME', plugin_basename(__FILE__));

pfct_debug_log('Constants defined - Path: ' . PFCT_PLUGIN_PATH);

// Check if required files exist before including them
$required_files = [
    PFCT_PLUGIN_PATH . 'includes/class-pfct-activator.php',
    PFCT_PLUGIN_PATH . 'includes/class-pfct-deactivator.php',
    PFCT_PLUGIN_PATH . 'includes/class-pfct-ajax.php',
    PFCT_PLUGIN_PATH . 'public/class-pfct-public.php',
    PFCT_PLUGIN_PATH . 'public/class-pfct-shortcode.php'
];

foreach ($required_files as $file) {
    if (file_exists($file)) {
        pfct_debug_log('File exists: ' . basename($file));
        require_once $file;
    } else {
        pfct_debug_log('MISSING FILE: ' . $file);
    }
}

// Check admin files
if (is_admin()) {
    $admin_files = [
        PFCT_PLUGIN_PATH . 'admin/class-pfct-admin-menu.php',
        PFCT_PLUGIN_PATH . 'includes/class-pfct-admin.php'
    ];
    
    foreach ($admin_files as $file) {
        if (file_exists($file)) {
            pfct_debug_log('Admin file exists: ' . basename($file));
            require_once $file;
        } else {
            pfct_debug_log('MISSING ADMIN FILE: ' . $file);
        }
    }
}

// Plugin activation hook with debugging
register_activation_hook(__FILE__, 'pfct_debug_activate');
function pfct_debug_activate() {
    pfct_debug_log('Plugin activation hook called');
    
    // Check if activator class exists
    if (class_exists('PFCT_Activator')) {
        pfct_debug_log('PFCT_Activator class found');
        PFCT_Activator::activate();
    } else {
        pfct_debug_log('ERROR: PFCT_Activator class not found');
    }
}

// Plugin deactivation hook with debugging
register_deactivation_hook(__FILE__, 'pfct_debug_deactivate');
function pfct_debug_deactivate() {
    pfct_debug_log('Plugin deactivation hook called');
    
    // Check if deactivator class exists
    if (class_exists('PFCT_Deactivator')) {
        pfct_debug_log('PFCT_Deactivator class found');
        PFCT_Deactivator::deactivate();
    } else {
        pfct_debug_log('ERROR: PFCT_Deactivator class not found');
    }
}

// Initialize the plugin with debugging
function pfct_debug_init() {
    pfct_debug_log('pfct_init() function called');
    
    // Load text domain
    $textdomain_loaded = load_plugin_textdomain('propfirm-comparison', false, dirname(PFCT_PLUGIN_BASENAME) . '/languages/');
    pfct_debug_log('Text domain loaded: ' . ($textdomain_loaded ? 'YES' : 'NO'));
    
    // Check if classes exist before initializing
    $classes_to_check = ['PFCT_Public', 'PFCT_Shortcode', 'PFCT_Ajax'];
    
    foreach ($classes_to_check as $class_name) {
        if (class_exists($class_name)) {
            pfct_debug_log($class_name . ' class found - initializing');
            new $class_name();
        } else {
            pfct_debug_log('ERROR: ' . $class_name . ' class not found');
        }
    }
    
    if (is_admin()) {
        $admin_classes = ['PFCT_Admin_Menu', 'PFCT_Admin'];
        
        foreach ($admin_classes as $class_name) {
            if (class_exists($class_name)) {
                pfct_debug_log($class_name . ' class found - initializing');
                new $class_name();
            } else {
                pfct_debug_log('ERROR: ' . $class_name . ' class not found');
            }
        }
    }
    
    pfct_debug_log('Plugin initialization complete');
}

add_action('plugins_loaded', 'pfct_debug_init');

// Add test line for debugging
add_action('wp_footer', function() { 
    echo '<!-- PropFirm Plugin Debug Version Active -->'; 
});

// Add a simple test shortcode to verify basic functionality
add_shortcode('pfct_debug_test', function() {
    return '<div style="background: #e7f3ff; padding: 10px; border: 1px solid #0073aa; margin: 10px 0;">PropFirm Debug Plugin is working! Check debug.log for detailed information.</div>';
});

pfct_debug_log('Plugin file processing complete');
?>
