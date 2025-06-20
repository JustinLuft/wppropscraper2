<?php
/**
 * Plugin activation functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Activator {
    
    /**
     * Plugin activation hook
     */
    public static function activate() {
        self::create_table();
        
        // Set default options
        if (!get_option('pfct_version')) {
            add_option('pfct_version', PFCT_VERSION);
        }
        
        // Flush rewrite rules if needed
        flush_rewrite_rules();
    }
    
    /**
     * Create the emails table
     */
    private static function create_table() {
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
        
        // Log any database errors
        if (!empty($wpdb->last_error)) {
            error_log('PFCT Plugin: Database table creation error - ' . $wpdb->last_error);
        }
    }
}
?>