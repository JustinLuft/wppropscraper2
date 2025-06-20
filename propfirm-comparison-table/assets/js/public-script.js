/**
 * Public JavaScript for PropFirm Comparison Table
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
                
                // Load table data
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
            // Auto-hide error after 5 seconds
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
            
            // Store original text if not already stored
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
            
            // Force reflow
            tableContainer.offsetHeight;
            
            tableContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            tableContainer.style.opacity = '1';
            tableContainer.style.transform = 'translateY(0)';
        }
    }

    // Load table data
    function loadTableData() {
        if (!tableContent) return;

        // Simulate loading delay for better UX
        setTimeout(() => {
            const tableHTML = `
                <table class="pfct-comparison-table">
                    <thead>
                        <tr>
                            <th>Business Name</th>
                            <th>Account Size</th>
                            <th>Sale Price</th>
                            <th>Trustpilot Score</th>
                            <th>Profit Target</th>
                            <th>Max Drawdown</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>FTMO</strong></td>
                            <td>$100,000</td>
                            <td class="pfct-price">$540</td>
                            <td class="pfct-trustpilot-score">4.1 ⭐</td>
                            <td>10%</td>
                            <td>10%</td>
                        </tr>
                        <tr>
                            <td><strong>Apex Trader Funding</strong></td>
                            <td>$100,000</td>
                            <td class="pfct-price">$157</td>
                            <td class="pfct-trustpilot-score">4.7 ⭐</td>
                            <td>8%</td>
                            <td>4%</td>
                        </tr>
                        <tr>
                            <td><strong>TopstepTrader</strong></td>
                            <td>$100,000</td>
                            <td class="pfct-price">$165</td>
                            <td class="pfct-trustpilot-score">3.8 ⭐</td>
                            <td>6%</td>
                            <td>3%</td>
                        </tr>
                        <tr>
                            <td><strong>The5%ers</strong></td>
                            <td>$100,000</td>
                            <td class="pfct-price">$230</td>
                            <td class="pfct-trustpilot-score">4.2 ⭐</td>
                            <td>8%</td>
                            <td>4%</td>
                        </tr>
                        <tr>
                            <td><strong>My Forex Funds</strong></td>
                            <td>$100,000</td>
                            <td class="pfct-price">$379</td>
                            <td class="pfct-trustpilot-score">4.5 ⭐</td>
                            <td>10%</td>
                            <td>5%</td>
                        </tr>
                    </tbody>
                </table>
                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    <p>* Prices and terms are subject to change. Please verify directly with each provider.</p>
                    <p>Last updated: ${new Date().toLocaleDateString()}</p>
                </div>
            `;
            
            tableContent.innerHTML = tableHTML;
            
            // Add hover effects to table rows
            addTableInteractivity();
        }, 1000);
    }

    // Add interactivity to table
    function addTableInteractivity() {
        const tableRows = document.querySelectorAll('.pfct-comparison-table tbody tr');
        
        tableRows.forEach(row => {
            row.addEventListener('click', function() {
                // You could add click functionality here
                // For example, highlighting the row or showing more details
                console.log('Row clicked:', this);
            });
        });
    }

    // Track conversion (integrate with your analytics)
    function trackConversion(email) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'event_category': 'PropFirm',
                'event_label': 'Email Captured',
                'value': 1
            });
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: 'PropFirm Comparison Table'
            });
        }
        
        // Custom tracking
        console.log('Email captured:', email);
    }

    // Input validation on typing
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            
            if (email && !isValidEmail(email)) {
                this.style.borderColor = '#d63638';
            } else {
                this.style.borderColor = '#ccc';
            }
        });
        
        // Clear error on focus
        emailInput.addEventListener('focus', function() {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }
});

// Utility function for smooth scrolling (if needed)
function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}