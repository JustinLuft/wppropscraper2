/**
 * Simplified Prop Firm Comparison Table
 * All customizations are at the top for easy editing
 */

// ========================================
// CUSTOMIZATION SETTINGS - EDIT THESE
// ========================================
const CONFIG = {
    // Colors
    colors: {
        primary: '#115bff',           // Main brand color
        primaryText: '#115bff',       // Primary text color
        white: '#ffffff',             // White backgrounds
        lightGray: '#f8f9fa',         // Hover backgrounds
        borderGray: '#dee2e6',        // Border colors
        textMuted: '#666666',         // Muted text
        errorRed: '#d63638'           // Error messages
    },
    
    // Data source
    csvUrl: 'https://raw.githubusercontent.com/JustinLuft/propdatascraper/main/plans_output.csv',
    
    // Pagination
    resultsPerPage: 15,
    
    // Table settings
    table: {
        minWidth: '1800px',
        fontSize: '14px',
        headerPadding: '15px',
        cellPadding: '12px'
    },
    
    // Animation
    scrollAmount: 200,
    debounceDelay: 300
};

// ========================================
// MAIN APPLICATION CODE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const tableContainer = document.getElementById('pfct-table-container');
    const tableContent = document.getElementById('pfct-table-content');

    // Global state
    let allData = [];
    let filteredData = [];
    let displayedData = [];
    let currentPage = 0;

    // Initialize
    if (tableContainer) {
        tableContainer.style.display = 'block';
        tableContainer.style.opacity = '1';
        loadTableData();
    }

    // ========================================
    // DATA PROCESSING FUNCTIONS
    // ========================================
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => row[header] = values[index]);
                data.push(row);
            }
        }
        return data;
    }

    function parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/"/g, ''));
                current = '';
            } else current += char;
        }
        values.push(current.trim().replace(/"/g, ''));
        return values;
    }

    // ========================================
    // FORMATTING FUNCTIONS
    // ========================================
    function formatCurrency(value) {
        if (!value || value === '' || value === 'N/A' || value === 'None') return 'N/A';
        if (value.toString().includes('$')) return value;
        
        // Check if the value contains non-numeric text (like "Contacts", "Steps", etc.)
        const hasNonNumericText = /[a-zA-Z]/.test(value.toString());
        if (hasNonNumericText) return value; // Return as-is if it contains letters
        
        const numValue = parseFloat(value.toString().replace(/[$,£€\s]/g, ''));
        return isNaN(numValue) ? value : `$${numValue.toLocaleString()}`;
    }

    function formatTrustpilotScore(score) {
        if (!score || score === '' || score === 'N/A') return 'N/A';
        
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return score;
        
        const stars = getStarRating(numScore);
        const color = getRatingColor(numScore);
        
        return `<span style="color: ${color}; font-weight: bold;">${numScore.toFixed(1)} ${stars}</span>`;
    }

    function getStarRating(score) {
        const fullStars = Math.floor(score);
        const hasHalfStar = score % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '★'.repeat(fullStars);
        if (hasHalfStar) stars += '☆';
        stars += '☆'.repeat(emptyStars);
        return stars;
    }

    function getRatingColor(score) {
        if (score >= 4.5) return '#00B67A';
        if (score >= 4.0) return '#73CF11';
        if (score >= 3.5) return '#FF8C00';
        if (score >= 2.5) return '#FF6D2E';
        return '#FF3722';
    }

    function normalizeAccountSize(size) {
        if (!size || size === '' || size === 'N/A') return 'N/A';
        if (size.toLowerCase().includes('contract')) return null;
        
        const numMatch = size.toString().match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (!numMatch) return size;
        
        const numValue = parseFloat(numMatch[1].replace(/,/g, ''));
        
        if (numValue >= 1000000) {
            return `$${(numValue / 1000000).toFixed(numValue % 1000000 === 0 ? 0 : 1)}M`;
        } else if (numValue >= 1000) {
            return `$${(numValue / 1000).toFixed(numValue % 1000 === 0 ? 0 : 1)}K`;
        }
        return `$${numValue.toLocaleString()}`;
    }

    function getNumericPrice(row) {
        const price = row.price_raw;
        if (!price || price === '' || price === 'N/A') return 0;
        const numMatch = price.toString().match(/\$?(\d+(?:\.\d+)?)/);
        return numMatch ? parseFloat(numMatch[1]) : 0;
    }

    // ========================================
    // UI CREATION FUNCTIONS
    // ========================================
    function createFilterControls(data) {
        const businesses = [...new Set(data.map(row => row.business_name))].filter(Boolean).sort();
        const accountSizes = getUniqueAccountSizes(data);

        const filterContainer = document.createElement('div');
        filterContainer.className = 'pfct-filters';
        filterContainer.style.cssText = getFilterStyles();
        filterContainer.innerHTML = getFilterHTML(businesses, accountSizes);

        return filterContainer;
    }

    function getFilterStyles() {
        return `
            background: ${CONFIG.colors.white};
            color: ${CONFIG.colors.primaryText};
            padding: 18px;
            margin-bottom: 20px;
            border-radius: 8px;
            border: 1px solid ${CONFIG.colors.borderGray};
        `;
    }

    function getFilterHTML(businesses, accountSizes) {
        return `
            <h3 style="margin-top: 0; margin-bottom: 15px; color: ${CONFIG.colors.primary};">Search & Filter Results</h3>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="pfct-search" placeholder="Search businesses, plans, account types..." 
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; color: ${CONFIG.colors.primaryText};">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                ${createSortControls()}
                ${createPriceFilter()}
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                ${createBusinessFilter(businesses)}
                ${createSizeFilter(accountSizes)}
                ${createRatingFilter()}
                ${createClearButton()}
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <span id="pfct-results-count" style="font-weight: bold; color: ${CONFIG.colors.primary} !important;"></span>
            </div>
        `;
    }

    function createSortControls() {
        return `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Sort By:</label>
                <select id="pfct-sort-column" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
                    <option value="price">Price</option>
                    <option value="business_name">Business Name</option>
                    <option value="account_size">Account Size</option>
                    <option value="profit_goal">Profit Goal</option>
                    <option value="trustpilot_score">Trustpilot Score</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Order:</label>
                <select id="pfct-sort-direction" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
                    <option value="asc">Low to High</option>
                    <option value="desc">High to Low</option>
                </select>
            </div>
        `;
    }

    function createPriceFilter() {
        return `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Max Price:</label>
                <input type="number" id="pfct-filter-price" placeholder="Max Price" 
                       style="width: 95%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
            </div>
        `;
    }

    function createBusinessFilter(businesses) {
        const options = businesses.map(business => `<option value="${business}">${business}</option>`).join('');
        return `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Business:</label>
                <select id="pfct-filter-business" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
                    <option value="">All Businesses</option>
                    ${options}
                </select>
            </div>
        `;
    }

    function createSizeFilter(accountSizes) {
        const options = accountSizes.map(size => `<option value="${size}">${size}</option>`).join('');
        return `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Account Size:</label>
                <select id="pfct-filter-size" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
                    <option value="">All Sizes</option>
                    ${options}
                </select>
            </div>
        `;
    }

    function createRatingFilter() {
        return `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary};">Min Rating:</label>
                <select id="pfct-filter-rating" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: ${CONFIG.colors.primaryText};">
                    <option value="">All Ratings</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3.0">3.0+ Stars</option>
                </select>
            </div>
        `;
    }

    function createClearButton() {
        return `
            <div style="display: flex; flex-direction: column;">
                <label style="margin-bottom: 5px; font-weight: bold; color: ${CONFIG.colors.primary}; opacity: 0;">Clear</label>
                <button id="pfct-clear-filters" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Clear All
                </button>
            </div>
        `;
    }

    function getUniqueAccountSizes(data) {
        return [...new Set(data.map(row => normalizeAccountSize(row.account_size)))]
            .filter(size => size !== null && size !== 'N/A')
            .sort((a, b) => {
                const aNum = parseFloat(a.replace(/[$,KM]/g, '')) * (a.includes('K') ? 1000 : a.includes('M') ? 1000000 : 1);
                const bNum = parseFloat(b.replace(/[$,KM]/g, '')) * (b.includes('K') ? 1000 : b.includes('M') ? 1000000 : 1);
                return aNum - bNum;
            });
    }

    function createTableHTML() {
        return `
            <div style="text-align: center; margin-bottom: 10px;">
                <button id="scroll-left" style="padding: 8px 12px; margin-right: 10px; background: ${CONFIG.colors.primary}; color: white; border: none; border-radius: 4px; cursor: pointer;">← Scroll Left</button>
                <button id="scroll-right" style="padding: 8px 12px; background: ${CONFIG.colors.primary}; color: white; border: none; border-radius: 4px; cursor: pointer;">Scroll Right →</button>
            </div>

            <div id="table-scroll-container" style="overflow-x: auto; border: 1px solid ${CONFIG.colors.borderGray}; border-radius: 4px; background: ${CONFIG.colors.white};">
                <table class="pfct-comparison-table" style="width: 100%; border-collapse: collapse; min-width: ${CONFIG.table.minWidth}; font-size: ${CONFIG.table.fontSize};">
                    <thead>
                        <tr style="background: ${CONFIG.colors.primary} !important; border-bottom: 2px solid ${CONFIG.colors.borderGray};">
                            ${createTableHeaders()}
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0;">
                <button id="pfct-load-more" style="padding: 12px 24px; background: ${CONFIG.colors.primary}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; display: none;">
                    Load More
                </button>
            </div>

            <div style="text-align: center; margin-top: 20px; font-size: 14px; color: ${CONFIG.colors.textMuted};">
                <p>* Prices and terms subject to change. Verify with providers.</p>
                <p>★ = Trustpilot ratings updated regularly</p>
                <p>Last updated: ${new Date().toLocaleDateString()}</p>
            </div>
        `;
    }

    function createTableHeaders() {
        const headers = [
            'Business', 'Plan Name', 'Account Type', 'Account Size', 'Price',
            'Profit Goal', 'Trailing Drawdown', 'Daily Loss Limit', 
            'Activation Fee', 'Reset Fee', 'Drawdown Mode', 'Trustpilot Rating'
        ];
        
        const minWidths = [140, 140, 120, 120, 120, 120, 140, 140, 140, 120, 140, 150];
        
        return headers.map((header, index) => 
            `<th style="padding: ${CONFIG.table.headerPadding}; text-align: left; border: 1px solid ${CONFIG.colors.borderGray}; min-width: ${minWidths[index]}px; color: ${CONFIG.colors.white} !important;">${header}</th>`
        ).join('');
    }

    // ========================================
    // DATA FILTERING AND SORTING
    // ========================================
    function applyFilters() {
        const filters = getFilterValues();
        filteredData = allData.filter(row => passesFilters(row, filters));
        sortData(filters.sortColumn, filters.sortDirection);
        resetPagination();
        loadMoreResults();
    }

    function getFilterValues() {
        return {
            search: document.getElementById('pfct-search')?.value.toLowerCase() || '',
            business: document.getElementById('pfct-filter-business')?.value || '',
            size: document.getElementById('pfct-filter-size')?.value || '',
            maxPrice: document.getElementById('pfct-filter-price')?.value || '',
            minRating: document.getElementById('pfct-filter-rating')?.value || '',
            sortColumn: document.getElementById('pfct-sort-column')?.value || 'price',
            sortDirection: document.getElementById('pfct-sort-direction')?.value || 'asc'
        };
    }

    function passesFilters(row, filters) {
        // Search filter
        if (filters.search) {
            const searchText = [row.business_name, row.plan_name, row.account_type, row.account_size, row.drawdown_mode]
                .join(' ').toLowerCase();
            if (!searchText.includes(filters.search)) return false;
        }

        // Business filter
        if (filters.business && row.business_name !== filters.business) return false;
        
        // Size filter
        if (filters.size && normalizeAccountSize(row.account_size) !== filters.size) return false;
        
        // Price filter
        if (filters.maxPrice) {
            const rowPrice = getNumericPrice(row);
            const maxPrice = parseFloat(filters.maxPrice);
            if (!isNaN(maxPrice) && rowPrice > 0 && rowPrice > maxPrice) return false;
        }

        // Rating filter
        if (filters.minRating) {
            const rowRating = parseFloat(row.trustpilot_score);
            const minRating = parseFloat(filters.minRating);
            if (isNaN(rowRating) || rowRating < minRating) return false;
        }

        return true;
    }

    function sortData(column, direction) {
        filteredData.sort((a, b) => {
            let valueA = getSortValue(a, column);
            let valueB = getSortValue(b, column);

            if (typeof valueA === 'string') {
                return direction === 'asc' ? 
                    valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            }
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        });
    }

    function getSortValue(row, column) {
        switch (column) {
            case 'price':
                return getNumericPrice(row);
            case 'profit_goal':
                return parseFloat(row.profit_goal?.replace(/[$,]/g, '')) || 0;
            case 'trustpilot_score':
                return parseFloat(row.trustpilot_score) || 0;
            default:
                return row[column] || '';
        }
    }

    // ========================================
    // TABLE RENDERING
    // ========================================
    function renderTable() {
        const tbody = document.querySelector('.pfct-comparison-table tbody');
        if (!tbody) return;

        if (currentPage === 1) tbody.innerHTML = '';

        if (displayedData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 20px; color: ${CONFIG.colors.textMuted};">No results match your criteria.</td></tr>`;
            return;
        }

        const startIndex = (currentPage - 1) * CONFIG.resultsPerPage;
        const newRows = displayedData.slice(startIndex);

        newRows.forEach(row => tbody.appendChild(createTableRow(row)));
        addTableInteractivity();
    }

    function createTableRow(row) {
        const tr = document.createElement('tr');
        tr.style.color = CONFIG.colors.primaryText;
        tr.innerHTML = `
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};"><strong>${row.business_name || 'N/A'}</strong></td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${row.plan_name || 'N/A'}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${row.account_type || 'N/A'}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${normalizeAccountSize(row.account_size) || 'N/A'}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${row.price_raw || 'N/A'}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${formatCurrency(row.profit_goal)}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${formatCurrency(row.trailing_drawdown)}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${formatCurrency(row.daily_loss_limit)}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${formatCurrency(row.activation_fee)}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${formatCurrency(row.reset_fee)}</td>
            <td style="color: ${CONFIG.colors.primaryText}; padding: ${CONFIG.table.cellPadding};">${row.drawdown_mode || 'N/A'}</td>
            <td class="pfct-trustpilot" style="padding: ${CONFIG.table.cellPadding};">${formatTrustpilotScore(row.trustpilot_score)}</td>
        `;
        return tr;
    }

    // ========================================
    // PAGINATION
    // ========================================
    function resetPagination() {
        currentPage = 0;
        displayedData = [];
    }

    function loadMoreResults() {
        const startIndex = currentPage * CONFIG.resultsPerPage;
        const endIndex = startIndex + CONFIG.resultsPerPage;
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
            countElement.style.color = CONFIG.colors.primary;
        }
    }

    function updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('pfct-load-more');
        if (loadMoreBtn) {
            const hasMore = displayedData.length < filteredData.length;
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
            if (hasMore) {
                const remaining = filteredData.length - displayedData.length;
                loadMoreBtn.textContent = `Load More (${Math.min(remaining, CONFIG.resultsPerPage)} more)`;
            }
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    function setupEventListeners() {
        setupFilterListeners();
        setupScrollControls();
        setupLoadMoreButton();
    }

    function setupFilterListeners() {
        // Search input with debounce
        const searchInput = document.getElementById('pfct-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(applyFilters, CONFIG.debounceDelay));
        }

        // Sort controls
        ['pfct-sort-column', 'pfct-sort-direction'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('change', applyFilters);
        });

        // Filter controls
        ['pfct-filter-business', 'pfct-filter-size', 'pfct-filter-rating'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('change', applyFilters);
        });

        // Price filter with debounce
        const priceFilter = document.getElementById('pfct-filter-price');
        if (priceFilter) {
            priceFilter.addEventListener('input', debounce(applyFilters, CONFIG.debounceDelay));
        }

        // Clear filters button
        const clearBtn = document.getElementById('pfct-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllFilters);
        }
    }

    function setupScrollControls() {
        const scrollContainer = document.getElementById('table-scroll-container');
        const scrollLeft = document.getElementById('scroll-left');
        const scrollRight = document.getElementById('scroll-right');

        if (scrollContainer && scrollLeft && scrollRight) {
            scrollLeft.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: -CONFIG.scrollAmount, behavior: 'smooth' });
            });

            scrollRight.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: CONFIG.scrollAmount, behavior: 'smooth' });
            });

            // Shift+scroll for horizontal scrolling
            scrollContainer.addEventListener('wheel', (e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    scrollContainer.scrollBy({ left: e.deltaY, behavior: 'smooth' });
                }
            });
        }
    }

    function setupLoadMoreButton() {
        const loadMoreBtn = document.getElementById('pfct-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreResults);
        }
    }

    function clearAllFilters() {
        document.getElementById('pfct-search').value = '';
        document.getElementById('pfct-filter-business').value = '';
        document.getElementById('pfct-filter-size').value = '';
        document.getElementById('pfct-filter-price').value = '';
        document.getElementById('pfct-filter-rating').value = '';
        document.getElementById('pfct-sort-column').value = 'price';
        document.getElementById('pfct-sort-direction').value = 'asc';
        applyFilters();
    }

    // ========================================
    // TABLE INTERACTIVITY
    // ========================================
    function addTableInteractivity() {
        const tableRows = document.querySelectorAll('.pfct-comparison-table tbody tr');
        
        tableRows.forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = CONFIG.colors.lightGray;
            });
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });

        const trustpilotCells = document.querySelectorAll('.pfct-trustpilot');
        trustpilotCells.forEach(cell => {
            cell.style.textAlign = 'center';
            cell.style.fontSize = '13px';
        });
    }

    // ========================================
    // MAIN LOAD FUNCTION
    // ========================================
    async function loadTableData() {
        if (!tableContent) return;

        tableContent.innerHTML = `<div style="text-align: center; padding: 20px; color: ${CONFIG.colors.primaryText};">Loading Prop Firm comparison data...</div>`;

        try {
            const response = await fetch(CONFIG.csvUrl);
            if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
            
            const csvText = await response.text();
            allData = parseCSV(csvText);
            filteredData = [...allData];
            
            if (allData.length === 0) throw new Error('No data found in CSV file');

            const filterControls = createFilterControls(allData);
            const tableHTML = createTableHTML();
            
            tableContent.innerHTML = '';
            tableContent.appendChild(filterControls);
            tableContent.insertAdjacentHTML('beforeend', tableHTML);
            
            setupEventListeners();
            applyFilters();
            
        } catch (error) {
            console.error('Error loading CSV data:', error);
            tableContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: ${CONFIG.colors.errorRed};">
                    <p>Unable to load data from CSV file.</p>
                    <p style="font-size: 12px; color: ${CONFIG.colors.textMuted};">${error.message}</p>
                </div>
            `;
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
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
});
