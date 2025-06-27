/**
 * Public JavaScript for PropFirm Comparison Table with Filtering - FIXED VERSION
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

    // Configuration - Your GitHub CSV URL
    const CSV_URL = 'https://raw.githubusercontent.com/JustinLuft/propdatascraper/refs/heads/main/combined_data.csv';
    
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

    // Format account size to show currency with K suffix (e.g. "$25K", "$50K", "$100K")
    function formatAccountSize(value) {
        if (!value || value === '' || value === 'N/A') return 'N/A';
        
        // Remove any existing formatting
        const cleanValue = value.toString().replace(/[$,]/g, '');
        const numValue = parseFloat(cleanValue);
        
        if (isNaN(numValue)) return value;
        
        return `$${numValue}K`;
    }

    // Format currency values
    function formatCurrency(value) {
        if (!value || value === '' || value === 'N/A') return 'N/A';
        const numValue = parseFloat(value.toString().replace(/[$,£€\s]/g, ''));
        return isNaN(numValue) ? value : `${numValue.toLocaleString()}`;
    }

    // Format percentage values
    function formatPercentage(value) {
        if (!value || value === '' || value === 'N/A') return 'N/A';
        return value.includes('%') ? value : `${value}%`;
    }

    // Get plan type from data - prioritize trial_type, fall back to plan_name
    function getPlanType(row) {
        // Check if we have valid trial type
        if (row.trial_type && row.trial_type !== '' && row.trial_type !== 'N/A') {
            return row.trial_type;
        }

        // Fall back to plan name
        if (row.plan_name && row.plan_name !== '' && row.plan_name !== 'N/A') {
            return row.plan_name;
        }

        return 'N/A';
    }


    // Create filter controls
    function createFilterControls(data) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'pfct-filters';
        filterContainer.style.cssText = `
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        `;

        // Get unique values for key filter fields
        const businesses = [...new Set(data.map(row => row.business_name))].filter(Boolean).sort();
        
        // For plan types, combine plan_name and trial_type
        const planTypes = [...new Set(data.map(row => getPlanType(row)))].filter(val => val !== 'N/A').sort();
        
        const accountSizes = [...new Set(data.map(row => row.account_size))].filter(Boolean).sort((a, b) => {
            const aNum = parseFloat(a.replace(/[$,K]/g, '')) * (a.includes('K') ? 1000 : 1);
            const bNum = parseFloat(b.replace(/[$,K]/g, '')) * (b.includes('K') ? 1000 : 1);
            return aNum - bNum;
        });
        
        const trialTypes = [...new Set(data.map(row => row.trial_type))].filter(Boolean).sort();

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
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Plan Type:</label>
                    <select id="pfct-filter-plan" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Plans</option>
                        ${planTypes.map(plan => `<option value="${plan}">${plan}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Account Size:</label>
                    <select id="pfct-filter-size" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Sizes</option>
                        ${accountSizes.map(size => `<option value="${size}">${formatAccountSize(size)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Trial Type:</label>
                    <select id="pfct-filter-trial" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Types</option>
                        ${trialTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Max Price:</label>
                    <input type="number" id="pfct-filter-price" placeholder="Enter max price" style="width: 120px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="display: flex; align-items: end;">
                    <button id="pfct-clear-filters" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
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

    / Replace the getNumericPrice function with this corrected version:

// Get numeric price value from row data - FIXED VERSION
function getNumericPrice(row) {
    // First priority: check for 'price' field (since you want to filter by price)
    if (row.price && row.price !== '' && row.price !== 'N/A') {
        // Remove currency symbols, commas, and other non-numeric characters
        const cleanPrice = row.price.toString().replace(/[$,£€\s]/g, '');
        const numPrice = parseFloat(cleanPrice);
        if (!isNaN(numPrice) && numPrice >= 0) {
            return numPrice;
        }
    }
    
    // Fallback to other price fields if 'price' is not available
    const priceFields = [
        row.funded_price,
        row.price_raw,
        row.cost,
        row.fee
    ];
    
    for (let price of priceFields) {
        if (price && price !== '' && price !== 'N/A') {
            // Remove currency symbols, commas, and other non-numeric characters
            const cleanPrice = price.toString().replace(/[$,£€\s]/g, '');
            const numPrice = parseFloat(cleanPrice);
            if (!isNaN(numPrice) && numPrice >= 0) {
                return numPrice;
            }
        }
    }
    
    return null; // Return null instead of 0 when no valid price found
}

// Also update the applyFilters function price filter logic:
function applyFilters() {
    const businessFilter = document.getElementById('pfct-filter-business')?.value || '';
    const planFilter = document.getElementById('pfct-filter-plan')?.value || '';
    const sizeFilter = document.getElementById('pfct-filter-size')?.value || '';
    const trialFilter = document.getElementById('pfct-filter-trial')?.value || '';
    const priceFilter = document.getElementById('pfct-filter-price')?.value || '';

    filteredData = allData.filter(row => {
        if (businessFilter && row.business_name !== businessFilter) return false;
        if (planFilter && getPlanType(row) !== planFilter) return false;
        if (sizeFilter && row.account_size !== sizeFilter) return false;
        if (trialFilter && row.trial_type !== trialFilter) return false;
        
        // FIXED: Price filter logic
        if (priceFilter) {
            const rowPrice = getNumericPrice(row);
            const maxPrice = parseFloat(priceFilter);
            
            // Skip rows with no valid price data, or filter out if price exceeds max
            if (rowPrice === null || isNaN(maxPrice) || rowPrice > maxPrice) {
                return false;
            }
        }
        
        return true;
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

    // Render table with current filtered data - FIXED COLUMN MAPPING
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
        //FRONTEND DISPLAY
        filteredData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.business_name || 'N/A'}</strong></td>
                <td>${getPlanType(row)}</td>
                <td>${formatAccountSize(row.account_size)}</td>
                <td>${row.profit_goal === 'N/A' ? 'N/A' : '' + row.profit_goal}</td>
                <td>${row.trial_type || 'N/A'}</td>
                <td class="pfct-trustpilot-score">${row.trustpilot_score || 'N/A'}</td>
                <td>${row.profit_goal.toLocaleString()}</td>
                <td>${row.source || 'N/A'}</td>
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
            
            // Build table HTML
            const tableHTML = `
                <table class="pfct-comparison-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Business</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Plan</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Account Size</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Price</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Trial Type</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Trustpilot</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Profit Goal</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Source</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
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
            
            // Initial render
            renderTable();
            updateResultsCount();
            
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
            'pfct-filter-size',
            'pfct-filter-trial',
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
                renderTable();
                updateResultsCount();
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
