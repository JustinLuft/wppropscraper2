<?php
/**
 * Plugin deactivation functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Deactivator {
    
    /**
     * Plugin deactivation hook
     */
    public static function deactivate() {
        // Clean up temporary data, caches, etc.
        self::cleanup_temp_data();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Note: We don't delete the database table here
        // That should only happen on uninstall
    }
    
    /**
     * Clean up temporary data
     */
    private static function cleanup_temp_data() {
        // Delete any transients or temporary options
        delete_transient('pfct_cached_data');
        
        // Clear any scheduled crons if we had any
        wp_clear_scheduled_hook('pfct_daily_cleanup');
    }
}
?>