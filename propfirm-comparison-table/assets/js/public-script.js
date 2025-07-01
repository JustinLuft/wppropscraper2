/**
 * Enhanced PropFirm Comparison Table - Added Pagination and Fixed Styling
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

    // Configuration
    const CSV_URL = 'https://raw.githubusercontent.com/JustinLuft/propdatascraper/main/plans_output.csv';
    const RESULTS_PER_PAGE = 15;
    
    // Global data storage
    let allData = [];
    let filteredData = [];
    let displayedData = [];
    let currentPage = 0;
    let currentSort = { column: 'price', direction: 'asc' };

    if (!form) return;

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const nonceField = document.getElementById('pfct_nonce');
        const nonce = nonceField ? nonceField.value : '';
        
        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        setLoadingState(true);

        try {
            const response = await fetch(pfct_ajax.ajax_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'pfct_save_email',
                    email: email,
                    nonce: nonce
                })
            });

            const data = await response.json();
            if (data.success) {
                hideEmailForm();
                showTableContainer();
                loadTableData();
                trackConversion(email);
            } else {
                showError(data.data || 'Failed to save email. Please try again.');
            }
        } catch (error) {
            showError('An error occurred. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Utility functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 5000);
        }
    }

    function setLoadingState(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Processing...' : 'Submit';
        }
        if (loadingDiv) loadingDiv.style.display = isLoading ? 'block' : 'none';
        if (errorDiv) errorDiv.style.display = 'none';
    }

    function hideEmailForm() {
        if (emailCapture) {
            emailCapture.style.transition = 'opacity 0.3s ease';
            emailCapture.style.opacity = '0';
            setTimeout(() => emailCapture.style.display = 'none', 300);
        }
    }

    function showTableContainer() {
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.opacity = '0';
            setTimeout(() => {
                tableContainer.style.transition = 'opacity 0.5s ease';
                tableContainer.style.opacity = '1';
            }, 50);
        }
    }

    // Enhanced CSV parsing
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/"/g, ''));
                    current = '';
                } else current += char;
            }
            values.push(current.trim().replace(/"/g, ''));
            
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => row[header] = values[index]);
                data.push(row);
            }
        }
        return data;
    }

    // Formatting functions
    function formatCurrency(value) {
        if (!value || value === '' || value === 'N/A' || value === 'None') return 'N/A';
        if (value.toString().includes('$')) return value;
        const numValue = parseFloat(value.toString().replace(/[$,£€\s]/g, ''));
        return isNaN(numValue) ? value : `$${numValue.toLocaleString()}`;
    }

    function formatTrustpilotScore(score) {
        if (!score || score === '' || score === 'N/A') return 'N/A';
        
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return score;
        
        const fullStars = Math.floor(numScore);
        const hasHalfStar = numScore % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '★'.repeat(fullStars);
        if (hasHalfStar) stars += '☆';
        stars += '☆'.repeat(emptyStars);
        
        let color = '#999';
        if (numScore >= 4.5) color = '#00B67A';
        else if (numScore >= 4.0) color = '#73CF11';
        else if (numScore >= 3.5) color = '#FF8C00';
        else if (numScore >= 2.5) color = '#FF6D2E';
        else color = '#FF3722';
        
        return `<span style="color: ${color}; font-weight: bold;">${numScore.toFixed(1)} ${stars}</span>`;
    }

    function getNumericPrice(row) {
        const price = row.price_raw;
        if (!price || price === '' || price === 'N/A') return 0;
        const numMatch = price.toString().match(/\$?(\d+(?:\.\d+)?)/);
        return numMatch ? parseFloat(numMatch[1]) : 0;
    }

    function getFormattedPrice(row) {
        return row.price_raw || 'N/A';
    }

    // Create filter controls
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

        const businesses = [...new Set(data.map(row => row.business_name))].filter(Boolean).sort();
        const accountSizes = [...new Set(data.map(row => row.account_size))].filter(Boolean).sort((a, b) => {
            const aNum = parseFloat(a.toString().replace(/[$,K]/g, ''));
            const bNum = parseFloat(b.toString().replace(/[$,K]/g, ''));
            return aNum - bNum;
        });

        filterContainer.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px; color: #333;">Search & Filter Results</h3>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="pfct-search" placeholder="Search businesses, plans, account types..." 
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Sort By:</label>
                    <select id="pfct-sort-column" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="price">Price</option>
                        <option value="business_name">Business Name</option>
                        <option value="account_size">Account Size</option>
                        <option value="profit_goal">Profit Goal</option>
                        <option value="trustpilot_score">Trustpilot Score</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Order:</label>
                    <select id="pfct-sort-direction" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Max Price:</label>
                    <input type="number" id="pfct-filter-price" placeholder="Max Price" 
                           style="width: 95%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Business:</label>
                    <select id="pfct-filter-business" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Businesses</option>
                        ${businesses.map(business => `<option value="${business}">${business}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Account Size:</label>
                    <select id="pfct-filter-size" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Sizes</option>
                        ${accountSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Min Rating:</label>
                    <select id="pfct-filter-rating" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">All Ratings</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.0">4.0+ Stars</option>
                        <option value="3.5">3.5+ Stars</option>
                        <option value="3.0">3.0+ Stars</option>
                    </select>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <label style="margin-bottom: 5px; font-weight: bold; color: #555; opacity: 0;">Clear</label>
                    <button id="pfct-clear-filters" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Clear All
                    </button>
                </div>
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <span id="pfct-results-count" style="font-weight: bold; color: #115bff !important;"></span>
            </div>
        `;

        return filterContainer;
    }

    // Apply filters and reset pagination
    function applyFilters() {
        const searchTerm = document.getElementById('pfct-search')?.value.toLowerCase() || '';
        const businessFilter = document.getElementById('pfct-filter-business')?.value || '';
        const sizeFilter = document.getElementById('pfct-filter-size')?.value || '';
        const priceFilter = document.getElementById('pfct-filter-price')?.value || '';
        const ratingFilter = document.getElementById('pfct-filter-rating')?.value || '';
        const sortColumn = document.getElementById('pfct-sort-column')?.value || 'price';
        const sortDirection = document.getElementById('pfct-sort-direction')?.value || 'asc';

        // Filter data
        filteredData = allData.filter(row => {
            if (searchTerm) {
                const searchableText = [
                    row.business_name, row.plan_name, row.account_type, 
                    row.account_size, row.drawdown_mode
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }

            if (businessFilter && row.business_name !== businessFilter) return false;
            if (sizeFilter && row.account_size !== sizeFilter) return false;
            if (priceFilter) {
                const rowPrice = getNumericPrice(row);
                const maxPrice = parseFloat(priceFilter);
                if (!isNaN(maxPrice) && rowPrice > 0 && rowPrice > maxPrice) return false;
            }

            if (ratingFilter) {
                const rowRating = parseFloat(row.trustpilot_score);
                const minRating = parseFloat(ratingFilter);
                if (isNaN(rowRating) || rowRating < minRating) return false;
            }

            return true;
        });

        // Sort data
        filteredData.sort((a, b) => {
            let valueA, valueB;
            
            if (sortColumn === 'price') {
                valueA = getNumericPrice(a);
                valueB = getNumericPrice(b);
            } else if (sortColumn === 'profit_goal') {
                valueA = parseFloat(a.profit_goal?.replace(/[$,]/g, '')) || 0;
                valueB = parseFloat(b.profit_goal?.replace(/[$,]/g, '')) || 0;
            } else if (sortColumn === 'trustpilot_score') {
                valueA = parseFloat(a.trustpilot_score) || 0;
                valueB = parseFloat(b.trustpilot_score) || 0;
            } else {
                valueA = a[sortColumn] || '';
                valueB = b[sortColumn] || '';
            }

            if (typeof valueA === 'string') {
                return sortDirection === 'asc' ? 
                    valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            } else {
                return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
            }
        });

        // Reset pagination
        currentPage = 0;
        displayedData = [];
        loadMoreResults();
    }

    // Load more results (pagination)
    function loadMoreResults() {
        const startIndex = currentPage * RESULTS_PER_PAGE;
        const endIndex = startIndex + RESULTS_PER_PAGE;
        const newResults = filteredData.slice(startIndex, endIndex);
        
        displayedData = [...displayedData, ...newResults];
        currentPage++;
        
        renderTable();
        updateResultsCount();
        updateLoadMoreButton();
    }

    function updateResultsCount() {
        const countElement = document.getElementById('pfct-results-count');
        if (countElement) {
            countElement.textContent = `Showing ${displayedData.length} of ${filteredData.length} results`;
            countElement.style.color = '#115bff';
        }
    }

    function updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('pfct-load-more');
        if (loadMoreBtn) {
            const hasMore = displayedData.length < filteredData.length;
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
            if (hasMore) {
                const remaining = filteredData.length - displayedData.length;
                loadMoreBtn.textContent = `Load More (${Math.min(remaining, RESULTS_PER_PAGE)} more)`;
            }
        }
    }

    // Render table with current displayed data
    function renderTable() {
        const tableElement = document.querySelector('.pfct-comparison-table');
        if (!tableElement) return;

        const tbody = tableElement.querySelector('tbody');
        if (!tbody) return;

        if (currentPage === 1) {
            tbody.innerHTML = '';
        }

        if (displayedData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 20px; color: #666;">No results match your criteria.</td></tr>';
            return;
        }

        const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
        const newRows = displayedData.slice(startIndex);

        newRows.forEach(row => {
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
                <td class="pfct-trustpilot">${formatTrustpilotScore(row.trustpilot_score)}</td>
                <td class="pfct-source-link">${row.source_url ? `<a href="${row.source_url}" target="_blank" style="color: #115bff; text-decoration: none;">Visit Site</a>` : 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });

        addTableInteractivity();
    }

    // Load and display table data
    async function loadTableData() {
        if (!tableContent) return;

        tableContent.innerHTML = '<div style="text-align: center; padding: 20px;">Loading data...</div>';

        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
            
            const csvText = await response.text();
            allData = parseCSV(csvText);
            filteredData = [...allData];
            
            if (allData.length === 0) throw new Error('No data found in CSV file');

            const filterControls = createFilterControls(allData);
            
            const tableHTML = `
                <div style="text-align: center; margin-bottom: 10px;">
                    <button id="scroll-left" style="padding: 8px 12px; margin-right: 10px; background: #115bff; color: white; border: none; border-radius: 4px; cursor: pointer;">← Scroll Left</button>
                    <button id="scroll-right" style="padding: 8px 12px; background: #115bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Scroll Right →</button>
                </div>

                <div id="table-scroll-container" style="overflow-x: auto; border: 1px solid #dee2e6; border-radius: 4px;">
                    <table class="pfct-comparison-table" style="width: 100%; border-collapse: collapse; min-width: 1600px;">
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
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 130px;">Trustpilot Rating</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">Visit Site</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <button id="pfct-load-more" style="padding: 12px 24px; background: #115bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; display: none;">
                        Load More
                    </button>
                </div>

                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    <p>* Prices and terms subject to change. Verify with providers.</p>
                    <p>★ = Trustpilot ratings updated regularly</p>
                    <p>Last updated: ${new Date().toLocaleDateString()}</p>
                </div>
            `;
            
            tableContent.innerHTML = '';
            tableContent.appendChild(filterControls);
            tableContent.insertAdjacentHTML('beforeend', tableHTML);
            
            setupFilterListeners();
            setupScrollControls();
            setupLoadMoreButton();
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

    // Setup all event listeners
    function setupFilterListeners() {
        const searchInput = document.getElementById('pfct-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(applyFilters, 300));
        }

        ['pfct-sort-column', 'pfct-sort-direction'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('change', applyFilters);
        });

        ['pfct-filter-business', 'pfct-filter-size', 'pfct-filter-price', 'pfct-filter-rating'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', applyFilters);
                if (element.type === 'number') {
                    element.addEventListener('input', debounce(applyFilters, 300));
                }
            }
        });

        const clearBtn = document.getElementById('pfct-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('pfct-search').value = '';
                document.getElementById('pfct-filter-business').value = '';
                document.getElementById('pfct-filter-size').value = '';
                document.getElementById('pfct-filter-price').value = '';
                document.getElementById('pfct-filter-rating').value = '';
                document.getElementById('pfct-sort-column').value = 'price';
                document.getElementById('pfct-sort-direction').value = 'asc';
                applyFilters();
            });
        }
    }

    // Setup load more button
    function setupLoadMoreButton() {
        const loadMoreBtn = document.getElementById('pfct-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreResults);
        }
    }

    // Setup horizontal scroll controls
    function setupScrollControls() {
        const scrollContainer = document.getElementById('table-scroll-container');
        const scrollLeft = document.getElementById('scroll-left');
        const scrollRight = document.getElementById('scroll-right');

        if (scrollContainer && scrollLeft && scrollRight) {
            scrollLeft.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
            });

            scrollRight.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
            });

            scrollContainer.addEventListener('wheel', (e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    scrollContainer.scrollBy({ left: e.deltaY, behavior: 'smooth' });
                }
            });
        }
    }

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

    // Table interactivity
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
        });

        const discountCells = document.querySelectorAll('.pfct-discount-code');
        discountCells.forEach(cell => {
            if (cell.textContent !== 'N/A' && cell.textContent.trim() !== '') {
                cell.style.backgroundColor = '#e7f3ff';
                cell.style.fontWeight = 'bold';
                cell.style.color = '#0066cc';
            }
        });

        const trustpilotCells = document.querySelectorAll('.pfct-trustpilot');
        trustpilotCells.forEach(cell => {
            cell.style.textAlign = 'center';
            cell.style.fontSize = '13px';
        });

        const sourceLinkCells = document.querySelectorAll('.pfct-source-link a');
        sourceLinkCells.forEach(link => {
            link.addEventListener('mouseenter', function() {
                this.style.textDecoration = 'underline';
            });
            link.addEventListener('mouseleave', function() {
                this.style.textDecoration = 'none';
            });
        });
    }

    function trackConversion(email) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'event_category': 'PropFirm',
                'event_label': 'Email Captured',
                'value': 1
            });
        }
        console.log('Email captured:', email);
    }

    // Input validation
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.style.borderColor = isValidEmail(this.value.trim()) ? '#ccc' : '#d63638';
        });
        
        emailInput.addEventListener('focus', function() {
            if (errorDiv) errorDiv.style.display = 'none';
        });
    }
});
