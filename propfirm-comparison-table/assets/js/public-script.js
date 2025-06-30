/**
 * Public JavaScript for PropFirm Comparison Table with New Attributes - UPDATED VERSION
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pfct-email-form');
    const emailInput = document.getElementById('pfct-email');
    const submitBtn = form ? form.querySelector('.pfct-submit-btn') : null;
    const loadingDiv = document.getElementById('pfct-loading');
    const errorDiv = document.getElementById('pfct-error');
    const emailCapture = document.getElementById('pfct-email-capture');
    const tableContainer = document.getElementById('pfct-table-container');
    const tableContent = document.getElementById('pfct-table-content');

    // Configuration - Updated GitHub CSV URL
    const CSV_URL = 'https://raw.githubusercontent.com/JustinLuft/propdatascraper/main/plans_output.csv';
    
    // Global data storage
    let allData = [];
    let filteredData = [];

    // Only proceed if form exists
    if (!form) return;

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const nonceField = document.getElementById('pfct_nonce');
        const nonce = nonceField ? nonceField.value : '';
        
        if (!email) {
            showError('Please enter a valid email address.');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const response = await fetch(pfct_ajax.ajax_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'pfct_save_email',
                    email: email,
                    nonce: nonce
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.success) {
                // Hide email form and show table
                hideEmailForm();
                showTableContainer();
                
                // Load table data from CSV
                loadTableData();
                
                // Track conversion (if analytics are available)
                trackConversion(email);
            } else {
                showError(data.data || 'Failed to save email. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred. Please check your internet connection and try again.');
        } finally {
            // Reset button state
            setLoadingState(false);
        }
    });

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show error message
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Set loading state
    function setLoadingState(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Processing...' : submitBtn.getAttribute('data-original-text') || 'Submit';
            
            if (!submitBtn.getAttribute('data-original-text')) {
                submitBtn.setAttribute('data-original-text', submitBtn.textContent);
            }
        }
        
        if (loadingDiv) {
            loadingDiv.style.display = isLoading ? 'block' : 'none';
        }
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Hide email form with animation
    function hideEmailForm() {
        if (emailCapture) {
            emailCapture.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            emailCapture.style.opacity = '0';
            emailCapture.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                emailCapture.style.display = 'none';
            }, 300);
        }
    }

    // Show table container with animation
    function showTableContainer() {
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.opacity = '0';
            tableContainer.style.transform = 'translateY(20px)';
            
            tableContainer.offsetHeight;
            
            tableContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            tableContainer.style.opacity = '1';
            tableContainer.style.transform = 'translateY(0)';
        }
    }

    // Parse CSV text into array of objects
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/"/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/"/g, ''));
            
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        return data;
    }

    // Format account size (already includes $ and K)
    function formatAccountSize(value) {
        if (!value || value === '' || value === 'N/A') return 'N/A';
        return value;
    }

    // Format currency values
    function formatCurrency(value) {
        if (!value || value === '' || value === 'N/A' || value === 'None') return 'N/A';
        
        // If it already has $ symbol, return as is
        if (value.toString().includes('$')) return value;
        
        const numValue = parseFloat(value.toString().replace(/[$,£€\s]/g, ''));
        return isNaN(numValue) ? value : `$${numValue.toLocaleString()}`;
    }

    // Format percentage values
    function formatPercentage(value) {
        if (!value || value === '' || value === 'N/A') return 'N/A';
        return value.includes('%') ? value : `${value}%`;
    }

    // Get numeric price value from price_raw field
    function getNumericPrice(row) {
        const price = row.price_raw;
        if (!price || price === '' || price === 'N/A') return 0;
        
        // Extract numeric value from strings like "$69 per month" or "$349 one time fee"
        const numMatch = price.toString().match(/\$?(\d+(?:\.\d+)?)/);
        if (numMatch) {
            return parseFloat(numMatch[1]);
        }
        
        return 0;
    }

    // Get formatted price for display
    function getFormattedPrice(row) {
        return row.price_raw || 'N/A';
    }

    // Create filter controls with new attributes
    function createFilterControls(data) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'pfct-filters';
        filterContainer.style.cssText = `
            background: #f8f9fa;
            padding: 18px;
            margin-bottom: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        `;

        // Get unique values for key filter fields
        const businesses = [...new Set(data.map(row => row.business_name))].filter(Boolean).sort();
        const planNames = [...new Set(data.map(row => row.plan_name))].filter(Boolean).sort();
        const accountTypes = [...new Set(data.map(row => row.account_type))].filter(Boolean).sort();
        const accountSizes = [...new Set(data.map(row => row.account_size))].filter(Boolean).sort((a, b) => {
            const aNum = parseFloat(a.toString().replace(/[$,K]/g, ''));
            const bNum = parseFloat(b.toString().replace(/[$,K]/g, ''));
            return aNum - bNum;
        });
        const drawdownModes = [...new Set(data.map(row => row.drawdown_mode))].filter(Boolean).sort();

        // Get min and max prices for the price filter
        const prices = data.map(row => getNumericPrice(row)).filter(price => price > 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        filterContainer.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px; color: #333;">Filter Results</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Business:</label>
                    <select id="pfct-filter-business" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Businesses</option>
                        ${businesses.map(business => `<option value="${business}">${business}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Plan Name:</label>
                    <select id="pfct-filter-plan" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Plans</option>
                        ${planNames.map(plan => `<option value="${plan}">${plan}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Account Type:</label>
                    <select id="pfct-filter-account-type" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Types</option>
                        ${accountTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Account Size:</label>
                    <select id="pfct-filter-size" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Sizes</option>
                        ${accountSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; align-items: start;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Drawdown Mode:</label>
                    <select id="pfct-filter-drawdown" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Modes</option>
                        ${drawdownModes.map(mode => `<option value="${mode}">${mode}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Max Price:</label>
                    <input type="number" id="pfct-filter-price" placeholder="Max: $${maxPrice}" min="${minPrice}" max="${maxPrice}" style="width: 95%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555; opacity: 0;">Clear</label>
                    <button id="pfct-clear-filters" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px; white-space: nowrap;">
                        Clear Filters
                    </button>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <span id="pfct-results-count" style="font-weight: bold; color: #007cba;"></span>
            </div>
        `;

        return filterContainer;
    }

    // Apply filters to data
    function applyFilters() {
        const businessFilter = document.getElementById('pfct-filter-business')?.value || '';
        const planFilter = document.getElementById('pfct-filter-plan')?.value || '';
        const accountTypeFilter = document.getElementById('pfct-filter-account-type')?.value || '';
        const sizeFilter = document.getElementById('pfct-filter-size')?.value || '';
        const drawdownFilter = document.getElementById('pfct-filter-drawdown')?.value || '';
        const priceFilter = document.getElementById('pfct-filter-price')?.value || '';

        filteredData = allData.filter(row => {
            // Business filter
            if (businessFilter && row.business_name !== businessFilter) return false;
            
            // Plan filter
            if (planFilter && row.plan_name !== planFilter) return false;
            
            // Account type filter
            if (accountTypeFilter && row.account_type !== accountTypeFilter) return false;
            
            // Size filter
            if (sizeFilter && row.account_size !== sizeFilter) return false;
            
            // Drawdown mode filter
            if (drawdownFilter && row.drawdown_mode !== drawdownFilter) return false;
            
            // Price filter
            if (priceFilter) {
                const rowPrice = getNumericPrice(row);
                const maxPrice = parseFloat(priceFilter);
                if (!isNaN(maxPrice) && rowPrice > 0 && rowPrice > maxPrice) {
                    return false;
                }
            }
            
            return true;
        });

        // Sort filtered data by price (lowest first)
        filteredData.sort((a, b) => {
            const priceA = getNumericPrice(a);
            const priceB = getNumericPrice(b);
            
            if (priceA === 0 && priceB === 0) return 0;
            if (priceA === 0) return 1;
            if (priceB === 0) return -1;
            
            return priceA - priceB;
        });

        renderTable();
        updateResultsCount();
    }

    // Update results count
    function updateResultsCount() {
        const countElement = document.getElementById('pfct-results-count');
        if (countElement) {
            countElement.textContent = `Showing ${filteredData.length} of ${allData.length} results`;
        }
    }

    // Render table with current filtered data - Updated with new columns
    function renderTable() {
        const tableElement = document.querySelector('.pfct-comparison-table');
        if (!tableElement) return;

        const tbody = tableElement.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #666;">No results match your filters.</td></tr>';
            return;
        }

        filteredData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.business_name || 'N/A'}</strong></td>
                <td>${row.plan_name || 'N/A'}</td>
                <td>${row.account_type || 'N/A'}</td>
                <td>${row.account_size || 'N/A'}</td>
                <td>${getFormattedPrice(row)}</td>
                <td>${formatCurrency(row.profit_goal)}</td>
                <td>${formatCurrency(row.trailing_drawdown)}</td>
                <td>${formatCurrency(row.daily_loss_limit)}</td>
                <td>${formatCurrency(row.activation_fee)}</td>
                <td>${formatCurrency(row.reset_fee)}</td>
                <td>${row.drawdown_mode || 'N/A'}</td>
                <td class="pfct-discount-code">${row.discount_code || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });

        addTableInteractivity();
    }

    // Load table data from CSV
    async function loadTableData() {
        if (!tableContent) return;

        tableContent.innerHTML = '<div style="text-align: center; padding: 20px;">Loading data...</div>';

        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status}`);
            }
            
            const csvText = await response.text();
            allData = parseCSV(csvText);
            filteredData = [...allData];
            
            if (allData.length === 0) {
                throw new Error('No data found in CSV file');
            }

            // Create filter controls
            const filterControls = createFilterControls(allData);
            
            // Build table HTML with new columns
            const tableHTML = `
                <div style="overflow-x: auto;">
                    <table class="pfct-comparison-table" style="width: 100%; border-collapse: collapse; margin-top: 20px; min-width: 1200px;">
                        <thead>
                            <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Business</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Plan Name</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">Account Type</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">Account Size</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Price</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">Profit Goal</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Trailing Drawdown</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Daily Loss Limit</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Activation Fee</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">Reset Fee</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Drawdown Mode</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Discount Code</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    <p>* Prices and terms are subject to change. Please verify directly with each provider.</p>
                    <p>Last updated: ${new Date().toLocaleDateString()}</p>
                    <p>Data source: <a href="${CSV_URL}" target="_blank" style="color: #666;">GitHub CSV</a></p>
                </div>
            `;
            
            tableContent.innerHTML = '';
            tableContent.appendChild(filterControls);
            tableContent.insertAdjacentHTML('beforeend', tableHTML);
            
            // Add event listeners for filters
            setupFilterListeners();
            
            // Initial render with sorting
            applyFilters();
            
        } catch (error) {
            console.error('Error loading CSV data:', error);
            
            tableContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #d63638;">
                    <p>Unable to load data from CSV file.</p>
                    <p style="font-size: 12px; color: #666;">${error.message}</p>
                </div>
            `;
        }
    }

    // Setup filter event listeners
    function setupFilterListeners() {
        const filterElements = [
            'pfct-filter-business',
            'pfct-filter-plan', 
            'pfct-filter-account-type',
            'pfct-filter-size',
            'pfct-filter-drawdown',
            'pfct-filter-price'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', applyFilters);
                if (element.type === 'number') {
                    element.addEventListener('input', debounce(applyFilters, 300));
                }
            }
        });

        // Clear filters button
        const clearBtn = document.getElementById('pfct-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                filterElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = '';
                    }
                });
                filteredData = [...allData];
                applyFilters();
            });
        }
    }

    // Debounce function for input events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add interactivity to table
    function addTableInteractivity() {
        const tableRows = document.querySelectorAll('.pfct-comparison-table tbody tr');
        
        tableRows.forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f8f9fa';
            });
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
            row.addEventListener('click', function() {
                console.log('Row clicked:', this);
            });
        });

        // Highlight discount codes
        const discountCells = document.querySelectorAll('.pfct-discount-code');
        discountCells.forEach(cell => {
            if (cell.textContent !== 'N/A' && cell.textContent.trim() !== '') {
                cell.style.backgroundColor = '#e7f3ff';
                cell.style.fontWeight = 'bold';
                cell.style.color = '#0066cc';
            }
        });
    }

    // Track conversion
    function trackConversion(email) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'event_category': 'PropFirm',
                'event_label': 'Email Captured',
                'value': 1
            });
        }
        
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: 'PropFirm Comparison Table'
            });
        }
        
        console.log('Email captured:', email);
    }

    // Input validation
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            
            if (email && !isValidEmail(email)) {
                this.style.borderColor = '#d63638';
            } else {
                this.style.borderColor = '#ccc';
            }
        });
        
        emailInput.addEventListener('focus', function() {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }
});

// Utility function for smooth scrolling
function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
