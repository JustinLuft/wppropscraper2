<?php
/**
 * Admin page display template
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>PropFirm Comparison Settings</h1>
    
    <div class="pfct-admin-content">
        <div class="pfct-info-box">
            <h2>Plugin Information</h2>
            <p>Use the shortcode <code>[pfct_comparison_table]</code> to display the comparison table on any page or post.</p>
        </div>
        
        <div class="pfct-settings-section">
            <h2>Settings</h2>
            <form method="post" action="options.php">
                <?php
                settings_fields('pfct_settings');
                do_settings_sections('pfct_settings');
                ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Table Style</th>
                        <td>
                            <select name="pfct_table_style">
                                <option value="default" <?php selected(get_option('pfct_table_style', 'default'), 'default'); ?>>Default</option>
                                <option value="modern" <?php selected(get_option('pfct_table_style', 'default'), 'modern'); ?>>Modern</option>
                                <option value="minimal" <?php selected(get_option('pfct_table_style', 'default'), 'minimal'); ?>>Minimal</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Show Header</th>
                        <td>
                            <input type="checkbox" name="pfct_show_header" value="1" <?php checked(get_option('pfct_show_header', 1), 1); ?>>
                            <label>Display table header</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Sorting</th>
                        <td>
                            <input type="checkbox" name="pfct_enable_sorting" value="1" <?php checked(get_option('pfct_enable_sorting', 1), 1); ?>>
                            <label>Allow users to sort columns</label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
    </div>
    
    <style>
    .pfct-admin-content {
        max-width: 800px;
    }
    .pfct-info-box {
        background: #e7f3ff;
        border: 1px solid #72aee6;
        padding: 20px;
        border-radius: 4px;
        margin: 20px 0;
    }
    .pfct-info-box h2 {
        margin-top: 0;
        color: #0073aa;
    }
    .pfct-info-box code {
        background: #fff;
        padding: 4px 8px;
        border-radius: 3px;
        font-family: monospace;
    }
    .pfct-settings-section {
        background: #fff;
        border: 1px solid #ccd0d4;
        padding: 20px;
        border-radius: 4px;
        margin: 20px 0;
    }
    .pfct-settings-section h2 {
        margin-top: 0;
    }
    </style>
</div>
