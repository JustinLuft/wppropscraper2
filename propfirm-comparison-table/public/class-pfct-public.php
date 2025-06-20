<?php
/**
 * Public-facing functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class PFCT_Public {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    /**
     * Enqueue public styles and scripts
     */
    public function enqueue_scripts() {
        wp_enqueue_style(
            'pfct-public-styles', 
            PFCT_PLUGIN_URL . 'assets/css/public-style.css', 
            array(), 
            PFCT_VERSION
        );
        
        wp_enqueue_script(
            'pfct-public-script', 
            PFCT_PLUGIN_URL . 'assets/js/public-script.js', 
            array('jquery'), 
            PFCT_VERSION, 
            true
        );
        
        // Localize script for AJAX
        wp_localize_script('pfct-public-script', 'pfct_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pfct_email_nonce'),
            'table_nonce' => wp_create_nonce('pfct_table_nonce')
        ));
    }
    
    /**
     * Get plugin version for cache busting
     */
    public function get_version() {
        return PFCT_VERSION;
    }
}
?>