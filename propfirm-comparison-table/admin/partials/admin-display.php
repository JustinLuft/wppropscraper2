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
    <h1>PropFirm Comparison - Email Subscribers</h1>
    
    <div class="pfct-admin-stats">
        <div class="pfct-stat-box">
            <h3>Total Subscribers</h3>
            <span class="pfct-stat-number"><?php echo count($emails); ?></span>
        </div>
        <div class="pfct-stat-box">
            <h3>This Month</h3>
            <span class="pfct-stat-number">
                <?php 
                $this_month = array_filter($emails, function($email) {
                    return date('Y-m', strtotime($email->created_at)) === date('Y-m');
                });
                echo count($this_month);
                ?>
            </span>
        </div>
    </div>
    
    <?php if ($emails): ?>
    <form method="post" id="pfct-emails-form">
        <?php wp_nonce_field('bulk-emails'); ?>
        
        <div class="tablenav top">
            <div class="alignleft actions bulkactions">
                <select name="action" id="bulk-action-selector-top">
                    <option value="-1">Bulk Actions</option>
                    <option value="delete_selected">Delete</option>
                </select>
                <input type="submit" class="button action" value="Apply">
            </div>
            <div class="alignright actions">
                <a href="<?php echo admin_url('admin.php?page=pfct-emails&action=export'); ?>" class="button">Export CSV</a>
            </div>
        </div>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <td class="manage-column column-cb check-column">
                        <input type="checkbox" id="cb-select-all-1">
                    </td>
                    <th class="manage-column column-id">ID</th>
                    <th class="manage-column column-email">Email</th>
                    <th class="manage-column column-date">Date Subscribed</th>
                    <th class="manage-column column-actions">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($emails as $email): ?>
                <tr>
                    <th class="check-column">
                        <input type="checkbox" name="email_ids[]" value="<?php echo esc_attr($email->id); ?>">
                    </th>
                    <td><?php echo esc_html($email->id); ?></td>
                    <td><?php echo esc_html($email->email); ?></td>
                    <td><?php echo esc_html(date('M j, Y g:i A', strtotime($email->created_at))); ?></td>
                    <td>
                        <a href="mailto:<?php echo esc_attr($email->email); ?>" class="button button-small">Email</a>
                        <a href="<?php echo admin_url('admin.php?page=pfct-emails&action=delete&id=' . $email->id . '&_wpnonce=' . wp_create_nonce('delete_email_' . $email->id)); ?>" 
                           class="button button-small" 
                           onclick="return confirm('Are you sure you want to delete this email?')">Delete</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </form>
    
    <style>
    .pfct-admin-stats {
        display: flex;
        gap: 20px;
        margin: 20px 0;
    }
    .pfct-stat-box {
        background: #fff;
        border: 1px solid #ccd0d4;
        padding: 20px;
        border-radius: 4px;
        text-align: center;
        min-width: 150px;
    }
    .pfct-stat-box h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #666;
    }
    .pfct-stat-number {
        font-size: 32px;
        font-weight: bold;
        color: #0073aa;
    }
    </style>
    
    <script>
    document.getElementById('cb-select-all-1').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('input[name="email_ids[]"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    </script>
    
    <?php else: ?>
    <div class="notice notice-info">
        <p>No email subscribers yet. The table will appear here once users start subscribing.</p>
        <p>Use the shortcode <code>[pfct_comparison_table]</code> to display the comparison table on any page or post.</p>
    </div>
    <?php endif; ?>
</div>