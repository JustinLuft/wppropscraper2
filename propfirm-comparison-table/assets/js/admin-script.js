/**
 * PropFirm Comparison Table - Admin JavaScript
 * 
 * @package PropFirm_Comparison_Table
 * @subpackage PropFirm_Comparison_Table/assets/js
 */

(function($) {
    'use strict';

    /**
     * Main admin functionality
     */
    const PFCTAdmin = {
        
        /**
         * Initialize admin functionality
         */
        init: function() {
            this.bindEvents();
            this.initializeComponents();
        },

        /**
         * Bind event handlers
         */
        bindEvents: function() {
            // Firm management
            $(document).on('submit', '#pfct-add-firm-form', this.handleAddFirm);
            $(document).on('click', '.pfct-edit-firm', this.handleEditFirm);
            $(document).on('click', '.pfct-delete-firm', this.handleDeleteFirm);
            $(document).on('click', '.pfct-save-firm', this.handleSaveFirm);
            $(document).on('click', '.pfct-cancel-edit', this.cancelEdit);
            
            // Settings
            $(document).on('change', '#pfct-settings-form input, #pfct-settings-form select', this.handleSettingsChange);
            
            // Import/Export
            $(document).on('click', '#pfct-export-data', this.exportData);
            $(document).on('change', '#pfct-import-file', this.handleImportFile);
            
            // Bulk actions
            $(document).on('click', '.pfct-bulk-action', this.handleBulkAction);
            $(document).on('change', '.pfct-select-all', this.handleSelectAll);
            
            // Preview
            $(document).on('click', '.pfct-preview-table', this.previewTable);
            
            // Help tooltips
            $(document).on('mouseenter', '.pfct-help-tip', this.showTooltip);
            $(document).on('mouseleave', '.pfct-help-tip', this.hideTooltip);
        },

        /**
         * Initialize components
         */
        initializeComponents: function() {
            this.initSortable();
            this.initColorPickers();
            this.initDatePickers();
            this.initTooltips();
            this.loadStats();
        },

        /**
         * Handle add firm form submission
         */
        handleAddFirm: function(e) {
            e.preventDefault();
            
            const form = $(this);
            const formData = new FormData(form[0]);
            formData.append('action', 'pfct_add_firm');
            formData.append('nonce', pfct_admin.nonce);

            PFCTAdmin.showLoading(form);

            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        PFCTAdmin.showNotice('Firm added successfully!', 'success');
                        form[0].reset();
                        PFCTAdmin.refreshFirmsTable();
                    } else {
                        PFCTAdmin.showNotice(response.data.message || 'Error adding firm', 'error');
                    }
                },
                error: function() {
                    PFCTAdmin.showNotice('Network error. Please try again.', 'error');
                },
                complete: function() {
                    PFCTAdmin.hideLoading(form);
                }
            });
        },

        /**
         * Handle edit firm
         */
        handleEditFirm: function(e) {
            e.preventDefault();
            
            const firmId = $(this).data('firm-id');
            const row = $(this).closest('tr');
            
            // Get current data
            const currentData = {
                name: row.find('td:eq(0)').text().trim(),
                min_deposit: row.find('td:eq(1)').text().trim(),
                max_drawdown: row.find('td:eq(2)').text().replace('%', '').trim(),
                profit_target: row.find('td:eq(3)').text().replace('%', '').trim(),
                profit_split: row.find('td:eq(4)').text().replace('%', '').trim()
            };
            
            // Convert to edit mode
            PFCTAdmin.createEditRow(row, currentData, firmId);
        },

        /**
         * Create edit row
         */
        createEditRow: function(row, data, firmId) {
            const editHtml = `
                <td><input type="text" value="${data.name}" name="edit_name" class="regular-text"></td>
                <td><input type="number" value="${data.min_deposit}" name="edit_min_deposit" class="small-text"></td>
                <td><input type="number" value="${data.max_drawdown}" name="edit_max_drawdown" class="small-text" step="0.1">%</td>
                <td><input type="number" value="${data.profit_target}" name="edit_profit_target" class="small-text" step="0.1">%</td>
                <td><input type="number" value="${data.profit_split}" name="edit_profit_split" class="small-text" step="0.1">%</td>
                <td>
                    <button class="button button-primary button-small pfct-save-firm" data-firm-id="${firmId}">Save</button>
                    <button class="button button-small pfct-cancel-edit">Cancel</button>
                </td>
            `;
            
            row.data('original-html', row.html());
            row.html(editHtml);
        },

        /**
         * Handle save firm
         */
        handleSaveFirm: function(e) {
            e.preventDefault();
            
            const firmId = $(this).data('firm-id');
            const row = $(this).closest('tr');
            
            const formData = {
                action: 'pfct_update_firm',
                firm_id: firmId,
                name: row.find('input[name="edit_name"]').val(),
                min_deposit: row.find('input[name="edit_min_deposit"]').val(),
                max_drawdown: row.find('input[name="edit_max_drawdown"]').val(),
                profit_target: row.find('input[name="edit_profit_target"]').val(),
                profit_split: row.find('input[name="edit_profit_split"]').val(),
                nonce: pfct_admin.nonce
            };

            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        PFCTAdmin.showNotice('Firm updated successfully!', 'success');
                        PFCTAdmin.refreshFirmsTable();
                    } else {
                        PFCTAdmin.showNotice(response.data.message || 'Error updating firm', 'error');
                    }
                },
                error: function() {
                    PFCTAdmin.showNotice('Network error. Please try again.', 'error');
                }
            });
        },

        /**
         * Cancel edit
         */
        cancelEdit: function(e) {
            e.preventDefault();
            
            const row = $(this).closest('tr');
            const originalHtml = row.data('original-html');
            
            if (originalHtml) {
                row.html(originalHtml);
            }
        },

        /**
         * Handle delete firm
         */
        handleDeleteFirm: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this firm? This action cannot be undone.')) {
                return;
            }
            
            const firmId = $(this).data('firm-id');
            const row = $(this).closest('tr');
            
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'pfct_delete_firm',
                    firm_id: firmId,
                    nonce: pfct_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        row.fadeOut(300, function() {
                            $(this).remove();
                        });
                        PFCTAdmin.showNotice('Firm deleted successfully!', 'success');
                    } else {
                        PFCTAdmin.showNotice(response.data.message || 'Error deleting firm', 'error');
                    }
                },
                error: function() {
                    PFCTAdmin.showNotice('Network error. Please try again.', 'error');
                }
            });
        },

        /**
         * Handle settings change
         */
        handleSettingsChange: function() {
            const settingsForm = $('#pfct-settings-form');
            PFCTAdmin.showUnsavedChanges(settingsForm);
        },

        /**
         * Export data
         */
        exportData: function(e) {
            e.preventDefault();
            
            const exportType = $('#pfct-export-type').val() || 'json';
            
            window.location.href = `${pfct_admin.ajax_url}?action=pfct_export_data&type=${exportType}&nonce=${pfct_admin.nonce}`;
        },

        /**
         * Handle import file
         */
        handleImportFile: function(e) {
            const file = e.target.files[0];
            
            if (!file) return;
            
            const formData = new FormData();
            formData.append('action', 'pfct_import_data');
            formData.append('import_file', file);
            formData.append('nonce', pfct_admin.nonce);
            
            PFCTAdmin.showLoading($('#pfct-import-section'));
            
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        PFCTAdmin.showNotice(`Import successful! ${response.data.count} firms imported.`, 'success');
                        PFCTAdmin.refreshFirmsTable();
                    } else {
                        PFCTAdmin.showNotice(response.data.message || 'Import failed', 'error');
                    }
                },
                error: function() {
                    PFCTAdmin.showNotice('Network error during import.', 'error');
                },
                complete: function() {
                    PFCTAdmin.hideLoading($('#pfct-import-section'));
                    $('#pfct-import-file').val('');
                }
            });
        },

        /**
         * Handle bulk actions
         */
        handleBulkAction: function(e) {
            e.preventDefault();
            
            const action = $('#pfct-bulk-action-select').val();
            const selectedIds = $('.pfct-firm-checkbox:checked').map(function() {
                return $(this).val();
            }).get();
            
            if (!action || selectedIds.length === 0) {
                PFCTAdmin.showNotice('Please select an action and at least one firm.', 'warning');
                return;
            }
            
            if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} firms?`)) {
                return;
            }
            
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'pfct_bulk_action',
                    bulk_action: action,
                    firm_ids: selectedIds,
                    nonce: pfct_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        PFCTAdmin.showNotice(response.data.message, 'success');
                        PFCTAdmin.refreshFirmsTable();
                    } else {
                        PFCTAdmin.showNotice(response.data.message || 'Bulk action failed', 'error');
                    }
                },
                error: function() {
                    PFCTAdmin.showNotice('Network error during bulk action.', 'error');
                }
            });
        },

        /**
         * Handle select all
         */
        handleSelectAll: function() {
            const isChecked = $(this).is(':checked');
            $('.pfct-firm-checkbox').prop('checked', isChecked);
        },

        /**
         * Preview table
         */
        previewTable: function(e) {
            e.preventDefault();
            
            // Open preview in modal or new tab
            const previewUrl = `${pfct_admin.site_url}?pfct_preview=1&nonce=${pfct_admin.nonce}`;
            window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes');
        },

        /**
         * Show tooltip
         */
        showTooltip: function(e) {
            const tooltip = $(this).data('tooltip');
            if (tooltip) {
                $('body').append(`<div id="pfct-tooltip" style="position:absolute;background:#333;color:#fff;padding:5px 10px;border-radius:3px;font-size:12px;z-index:9999;">${tooltip}</div>`);
                $('#pfct-tooltip').css({
                    top: e.pageY + 10,
                    left: e.pageX + 10
                });
            }
        },

        /**
         * Hide tooltip
         */
        hideTooltip: function() {
            $('#pfct-tooltip').remove();
        },

        /**
         * Initialize sortable
         */
        initSortable: function() {
            if ($.fn.sortable) {
                $('.pfct-sortable').sortable({
                    handle: '.pfct-sort-handle',
                    update: function() {
                        PFCTAdmin.saveSortOrder();
                    }
                });
            }
        },

        /**
         * Initialize color pickers
         */
        initColorPickers: function() {
            if ($.fn.wpColorPicker) {
                $('.pfct-color-picker').wpColorPicker();
            }
        },

        /**
         * Initialize date pickers
         */
        initDatePickers: function() {
            if ($.fn.datepicker) {
                $('.pfct-date-picker').datepicker({
                    dateFormat: 'yy-mm-dd'
                });
            }
        },

        /**
         * Initialize tooltips
         */
        initTooltips: function() {
            if ($.fn.tooltip) {
                $('.pfct-tooltip').tooltip();
            }
        },

        /**
         * Load dashboard stats
         */
        loadStats: function() {
            if ($('.pfct-dashboard').length === 0) return;
            
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'pfct_get_stats',
                    nonce: pfct_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        PFCTAdmin.updateStatsDisplay(response.data);
                    }
                }
            });
        },

        /**
         * Update stats display
         */
        updateStatsDisplay: function(stats) {
            $('.pfct-stat-number').each(function() {
                const statType = $(this).parent().find('h3').text().toLowerCase();
                if (stats[statType]) {
                    $(this).text(stats[statType]);
                }
            });
        },

        /**
         * Refresh firms table
         */
        refreshFirmsTable: function() {
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'pfct_refresh_firms_table',
                    nonce: pfct_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $('#pfct-firms-table').html(response.data.html);
                    }
                }
            });
        },

        /**
         * Save sort order
         */
        saveSortOrder: function() {
            const order = $('.pfct-sortable').sortable('toArray', {attribute: 'data-firm-id'});
            
            $.ajax({
                url: pfct_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'pfct_save_sort_order',
                    order: order,
                    nonce: pfct_admin.nonce
                }
            });
        },

        /**
         * Show loading state
         */
        showLoading: function(element) {
            element.addClass('pfct-loading').find('input, button').prop('disabled', true);
        },

        /**
         * Hide loading state
         */
        hideLoading: function(element) {
            element.removeClass('pfct-loading').find('input, button').prop('disabled', false);
        },

        /**
         * Show notice
         */
        showNotice: function(message, type = 'info') {
            const noticeClass = `notice notice-${type} is-dismissible`;
            const notice = $(`<div class="${noticeClass}"><p>${message}</p></div>`);
            
            $('.wrap h1').after(notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                notice.fadeOut();
            }, 5000);
        },

        /**
         * Show unsaved changes indicator
         */
        showUnsavedChanges: function(form) {
            if (!form.hasClass('pfct-has-changes')) {
                form.addClass('pfct-has-changes');
                form.find('.submit').prepend('<span class="pfct-unsaved-indicator">● Unsaved changes</span>');
            }
        }
    };

    /**
     * Initialize when document is ready
     */
    $(document).ready(function() {
        PFCTAdmin.init();
    });

    /**
     * Warn about unsaved changes
     */
    $(window).on('beforeunload', function() {
        if ($('.pfct-has-changes').length > 0) {
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
    });

})(jQuery);