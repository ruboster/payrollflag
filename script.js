document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFileInput');
    const fileName = document.getElementById('fileName');
    const runQaCheckButton = document.getElementById('runQaCheck');
    const risksTableBody = document.getElementById('risksTableBody');
    const summarySection = document.getElementById('summarySection');
    const summaryText = document.getElementById('summaryText');
    const alertsContainer = document.getElementById('alertsContainer');
    const alertsDiv = document.getElementById('alerts');
    const exportCsvButton = document.getElementById('exportCsv');
    const uploadNotification = document.getElementById('uploadNotification');
    
    // Define risk keywords for automatic risk assessment
    const HIGH_RISK_KEYWORDS = ["assumed", "unverified", "outdated", "no one responded", "critical", "urgent", "failed"];
    const MEDIUM_RISK_KEYWORDS = ["delayed", "pending", "waiting", "scheduled", "partial"];
    
    // Store the current risk data
    let currentRiskData = [];
    
    // Store the uploaded CSV data
    let uploadedData = null;
    
    // Current filter state
    let currentFilter = 'all';
    
    // Listen for file upload
    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileName.style.display = 'block';
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const csvData = event.target.result;
                uploadedData = parseCSV(csvData);
                
                // Show success message
                uploadNotification.textContent = '✅ File uploaded successfully! Click "Run QA Check" to analyze.';
                uploadNotification.style.color = 'green';
                
                // Enable the QA check button
                if (runQaCheckButton) {
                    runQaCheckButton.disabled = false;
                }
            };
            
            reader.onerror = function() {
                uploadNotification.textContent = '❌ Error reading file!';
                uploadNotification.style.color = 'red';
            };
            
            reader.readAsText(file);
        }
    });
    
    // Function to parse CSV data
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            // Handle quoted values with commas inside them
            const row = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let char of lines[i]) {
                if (char === '"' && !inQuotes) {
                    inQuotes = true;
                } else if (char === '"' && inQuotes) {
                    inQuotes = false;
                } else if (char === ',' && !inQuotes) {
                    row.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            // Add the last value
            row.push(currentValue.trim());
            
            // Create object from headers and values
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = j < row.length ? row[j] : '';
            }
            
            result.push(entry);
        }
        
        return result;
    }
    
    // Function to analyze CSV data for risks
    function analyzeRisks(data) {
        return data.map(item => {
            // Determine risk level based on keywords in notes
            let riskLevel = 'low';
            const notes = item.Notes ? item.Notes.toLowerCase() : '';
            
            // Check for high risk keywords
            for (const keyword of HIGH_RISK_KEYWORDS) {
                if (notes.includes(keyword.toLowerCase())) {
                    riskLevel = 'high';
                    break;
                }
            }
            
            // Check for medium risk keywords if not already high
            if (riskLevel !== 'high') {
                for (const keyword of MEDIUM_RISK_KEYWORDS) {
                    if (notes.includes(keyword.toLowerCase())) {
                        riskLevel = 'medium';
                        break;
                    }
                }
            }
            
            // Determine completion status based on Task_Completed field
            const isComplete = item.Task_Completed === 'Yes';
            
            return {
                department: item.Department || '',
                task: item.Task || '',
                status: isComplete ? 'complete' : 'incomplete',
                risk_level: riskLevel,
                notes: item.Notes || ''
            };
        });
    }
    
    // Function to populate the table with risk data
    function populateRisksTable(data) {
        risksTableBody.innerHTML = '';
        
        // Group data by department
        const departmentGroups = {};
        
        // First, group all items by department
        data.forEach(item => {
            if (shouldShowItem(item)) {
                const dept = item.department || 'Uncategorized';
                if (!departmentGroups[dept]) {
                    departmentGroups[dept] = [];
                }
                departmentGroups[dept].push(item);
            }
        });
        
        // Then, create rows for each department group
        Object.keys(departmentGroups).sort().forEach(department => {
            const items = departmentGroups[department];
            
            // Add a department header row
            const headerRow = document.createElement('tr');
            headerRow.className = 'department-header';
            
            const headerCell = document.createElement('td');
            headerCell.colSpan = 5;
            headerCell.textContent = department;
            headerCell.className = 'department-name';
            
            headerRow.appendChild(headerCell);
            risksTableBody.appendChild(headerRow);
            
            // Add all items for this department
            items.forEach(item => {
                const row = document.createElement('tr');
                
                const departmentCell = document.createElement('td');
                departmentCell.textContent = item.department;
                
                const taskCell = document.createElement('td');
                taskCell.textContent = item.task;
                
                const statusCell = document.createElement('td');
                if (item.status === 'complete') {
                    statusCell.innerHTML = '✅ Complete';
                    statusCell.className = 'status-complete';
                } else {
                    statusCell.innerHTML = '❌ Incomplete';
                    statusCell.className = 'status-incomplete';
                }
                
                const riskCell = document.createElement('td');
                riskCell.textContent = item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1);
                riskCell.className = `risk-${item.risk_level}`;
                
                const notesCell = document.createElement('td');
                notesCell.textContent = item.notes;
                
                row.appendChild(departmentCell);
                row.appendChild(taskCell);
                row.appendChild(statusCell);
                row.appendChild(riskCell);
                row.appendChild(notesCell);
                
                risksTableBody.appendChild(row);
            });
        });
    }
    
    // Function to check if an item should be shown based on current filter
    function shouldShowItem(item) {
        switch (currentFilter) {
            case 'incomplete':
                return item.status === 'incomplete';
            case 'high-risk':
                return item.risk_level === 'high';
            case 'medium-risk':
                return item.risk_level === 'medium';
            case 'all':
            default:
                return true;
        }
    }
    
    // Function to generate and display summary
    function displaySummary(data) {
        // Create summary section if it doesn't exist
        if (!document.getElementById('summaryCards')) {
            const summaryCards = document.createElement('div');
            summaryCards.id = 'summaryCards';
            summaryCards.className = 'summary-cards';
            
            // Incomplete tasks card
            const incompleteCard = createSummaryCard(
                'incompleteTasksCard',
                '⚠️',
                countIncomplete(data),
                'Incomplete Tasks',
                'incomplete'
            );
            
            // High risk card
            const highRiskCard = createSummaryCard(
                'highRiskCard',
                '🔴',
                countRiskLevel(data, 'high'),
                'High Risk Issues',
                'high-risk'
            );
            
            // Medium risk card
            const mediumRiskCard = createSummaryCard(
                'mediumRiskCard',
                '🟠',
                countRiskLevel(data, 'medium'),
                'Medium Risk Issues',
                'medium-risk'
            );
            
            summaryCards.appendChild(incompleteCard);
            summaryCards.appendChild(highRiskCard);
            summaryCards.appendChild(mediumRiskCard);
            
            // Create filter controls
            const filterControls = document.createElement('div');
            filterControls.className = 'filter-controls';
            
            const filterLabel = document.createElement('div');
            filterLabel.className = 'filter-label';
            filterLabel.textContent = 'Filter Tasks:';
            
            const filterButtons = document.createElement('div');
            filterButtons.className = 'filter-buttons';
            
            const allButton = createFilterButton('all', 'All Tasks', true);
            const incompleteButton = createFilterButton('incomplete', 'Incomplete');
            const highRiskButton = createFilterButton('high-risk', 'High Risk');
            const mediumRiskButton = createFilterButton('medium-risk', 'Medium Risk');
            
            filterButtons.appendChild(allButton);
            filterButtons.appendChild(incompleteButton);
            filterButtons.appendChild(highRiskButton);
            filterButtons.appendChild(mediumRiskButton);
            
            filterControls.appendChild(filterLabel);
            filterControls.appendChild(filterButtons);
            
            // Insert summary cards and filter controls before the results section
            const resultsSection = document.querySelector('.results-section');
            resultsSection.parentNode.insertBefore(summaryCards, resultsSection);
            resultsSection.parentNode.insertBefore(filterControls, resultsSection);
        } else {
            // Update existing summary cards
            document.querySelector('#incompleteTasksCard .card-value').textContent = countIncomplete(data);
            document.querySelector('#highRiskCard .card-value').textContent = countRiskLevel(data, 'high');
            document.querySelector('#mediumRiskCard .card-value').textContent = countRiskLevel(data, 'medium');
        }
        
        // Show the summary section
        summarySection.classList.remove('hidden');
        
        // Update summary text
        const totalTasks = data.length;
        const incompleteTasks = countIncomplete(data);
        const highRiskTasks = countRiskLevel(data, 'high');
        
        summaryText.innerHTML = `
            Total tasks: <strong>${totalTasks}</strong><br>
            Incomplete tasks: <strong>${incompleteTasks}</strong> (${Math.round(incompleteTasks/totalTasks*100)}%)<br>
            High risk issues: <strong>${highRiskTasks}</strong><br>
            <br>
            ${highRiskTasks > 0 ? '<strong>⚠️ Action required:</strong> Address high risk issues before proceeding with payroll launch.' : ''}
        `;
    }
    
    // Helper function to create a summary card
    function createSummaryCard(id, icon, value, label, filterValue) {
        const card = document.createElement('div');
        card.id = id;
        card.className = 'summary-card';
        card.innerHTML = `
            <div class="card-icon">${icon}</div>
            <div class="card-content">
                <div class="card-value">${value}</div>
                <div class="card-label">${label}</div>
            </div>
        `;
        
        // Add click event to filter
        card.addEventListener('click', function() {
            setFilter(filterValue);
        });
        
        return card;
    }
    
    // Helper function to create a filter button
    function createFilterButton(value, label, isActive = false) {
        const button = document.createElement('button');
        button.className = `filter-button ${isActive ? 'active' : ''}`;
        button.dataset.filter = value;
        button.textContent = label;
        
        button.addEventListener('click', function() {
            setFilter(value);
        });
        
        return button;
    }
    
    // Function to set the current filter
    function setFilter(filter) {
        currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Update table
        populateRisksTable(currentRiskData);
    }
    
    // Helper function to count incomplete tasks
    function countIncomplete(data) {
        return data.filter(item => item.status === 'incomplete').length;
    }
    
    // Helper function to count tasks by risk level
    function countRiskLevel(data, level) {
        return data.filter(item => item.risk_level === level).length;
    }
    
    // Function to display alerts
    function displayAlerts(alerts) {
        alertsDiv.innerHTML = '';
        
        if (alerts.length === 0) {
            alertsContainer.classList.add('hidden');
            return;
        }
        
        // Add alerts header without the download button
        const alertsHeader = document.createElement('div');
        alertsHeader.className = 'alerts-header';
        
        const alertsTitle = document.createElement('h3');
        alertsTitle.textContent = 'Critical Issues Requiring Attention';
        alertsTitle.className = 'alerts-title';
        
        alertsHeader.appendChild(alertsTitle);
        alertsDiv.appendChild(alertsHeader);
        
        // Group alerts by department
        const departmentAlerts = {};
        
        alerts.forEach(alert => {
            const dept = alert.department || 'General';
            if (!departmentAlerts[dept]) {
                departmentAlerts[dept] = [];
            }
            departmentAlerts[dept].push(alert);
        });
        
        // Create alerts for each department
        for (const dept in departmentAlerts) {
            const deptAlerts = departmentAlerts[dept];
            
            deptAlerts.forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert alert-${alert.risk_level}`;
                
                const alertHeader = document.createElement('div');
                alertHeader.className = 'alert-header';
                
                const alertTitle = document.createElement('div');
                alertTitle.className = 'alert-title';
                alertTitle.innerHTML = `
                    ${alert.risk_level === 'high' ? '🔴' : '🟠'} 
                    ${alert.title}
                    <span class="alert-department">${dept}</span>
                `;
                
                const expandButton = document.createElement('span');
                expandButton.textContent = '▼';
                expandButton.style.cursor = 'pointer';
                
                alertHeader.appendChild(alertTitle);
                alertHeader.appendChild(expandButton);
                
                const alertMessage = document.createElement('div');
                alertMessage.className = 'alert-message';
                alertMessage.textContent = alert.message;
                
                const alertDetails = document.createElement('div');
                alertDetails.className = 'alert-details';
                
                // Add suggestion based on department
                const suggestion = document.createElement('div');
                suggestion.className = 'alert-suggestion';
                
                switch (dept.toLowerCase()) {
                    case 'hr':
                        suggestion.textContent = 'Suggestion: Verify employee data with HR department before proceeding.';
                        break;
                    case 'finance':
                        suggestion.textContent = 'Suggestion: Confirm budget allocations and payment schedules with Finance team.';
                        break;
                    case 'it':
                        suggestion.textContent = 'Suggestion: Schedule a technical review with IT team to address system issues.';
                        break;
                    default:
                        suggestion.textContent = 'Suggestion: Escalate this issue to the relevant department head for immediate review.';
                }
                
                alertDetails.appendChild(suggestion);
                
                // Add comment section
                const commentsSection = document.createElement('div');
                commentsSection.className = 'alert-comments';
                commentsSection.innerHTML = '<strong>Comments:</strong>';
                
                const commentInput = document.createElement('div');
                commentInput.className = 'comment-input';
                commentInput.innerHTML = `
                    <input type="text" placeholder="Add a comment...">
                    <button>Send</button>
                `;
                
                commentsSection.appendChild(commentInput);
                alertDetails.appendChild(commentsSection);
                
                // Toggle details on click
                alertHeader.addEventListener('click', function() {
                    alertDetails.classList.toggle('show');
                    expandButton.textContent = alertDetails.classList.contains('show') ? '▲' : '▼';
                });
                
                alertDiv.appendChild(alertHeader);
                alertDiv.appendChild(alertMessage);
                alertDiv.appendChild(alertDetails);
                
                alertsDiv.appendChild(alertDiv);
            });
        }
        
        alertsContainer.classList.remove('hidden');
    }
    
    // Function to download alerts as CSV
    function downloadAlertsCSV(alerts) {
        if (alerts.length === 0) return;
        
        // CSV header
        let csvContent = "Department,Task,Risk Level,Issue,Suggestion\n";
        
        // Add each alert to CSV
        alerts.forEach(alert => {
            const department = alert.department ? alert.department.replace(/,/g, ";") : "General";
            const task = alert.title.replace(/,/g, ";").replace(/needs attention/g, "");
            const riskLevel = alert.risk_level;
            const issue = alert.message.replace(/,/g, ";").replace(/\n/g, " ");
            
            // Generate suggestion based on department
            let suggestion = "";
            switch (department.toLowerCase()) {
                case 'hr':
                    suggestion = "Verify employee data with HR department before proceeding.";
                    break;
                case 'finance':
                    suggestion = "Confirm budget allocations and payment schedules with Finance team.";
                    break;
                case 'it':
                    suggestion = "Schedule a technical review with IT team to address system issues.";
                    break;
                default:
                    suggestion = "Escalate this issue to the relevant department head for immediate review.";
            }
            
            csvContent += `${department},${task},${riskLevel},${issue},${suggestion}\n`;
        });
        
        // Download the CSV file
        const date = new Date().toISOString().slice(0, 10);
        downloadCSV(csvContent, `payroll-alerts-${date}.csv`);
    }
    
    // Function to generate alerts from risk data
    function generateAlerts(data) {
        // Filter high risk and incomplete tasks
        const alertItems = data.filter(item => 
            item.risk_level === 'high' && item.status === 'incomplete'
        );
        
        // Convert to alert format
        return alertItems.map(item => ({
            title: `${item.task} needs attention`,
            message: item.notes,
            risk_level: item.risk_level,
            department: item.department
        }));
    }
    
    // Function to convert risk data to CSV
    function convertToCSV(data) {
        // CSV header
        let csvContent = "Department,Task,Status,Risk Level,Notes\n";
        
        // Add each row of data
        data.forEach(item => {
            const department = item.department.replace(/,/g, ";"); // Replace commas with semicolons
            const task = item.task.replace(/,/g, ";");
            const status = item.status;
            const riskLevel = item.risk_level;
            const notes = item.notes.replace(/,/g, ";").replace(/\n/g, " "); // Replace commas and newlines
            
            csvContent += `${department},${task},${status},${riskLevel},${notes}\n`;
        });
        
        return csvContent;
    }
    
    // Function to download CSV file
    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        // Add to document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Event listener for Export CSV button
    exportCsvButton.addEventListener('click', function() {
        if (currentRiskData.length > 0) {
            // Filter data based on current filter
            const dataToExport = currentRiskData.filter(shouldShowItem);
            
            const csvContent = convertToCSV(dataToExport);
            const date = new Date().toISOString().slice(0, 10);
            downloadCSV(csvContent, `payroll-risks-${date}.csv`);
        }
    });
    
    // Event listener for the "Run QA Check" button
    runQaCheckButton.addEventListener('click', function() {
        // Run QA check when button is clicked
        runQaCheckButton.addEventListener('click', function() {
            if (!uploadedData || uploadedData.length === 0) {
                alert('Please upload a CSV file first.');
                return;
            }
            
            // Analyze risks
            currentRiskData = analyzeRisks(uploadedData);
            
            // Display summary
            displaySummary(currentRiskData);
            
            // Populate table
            populateRisksTable(currentRiskData);
            
            // Generate and display alerts
            const alerts = generateAlerts(currentRiskData);
            displayAlerts(alerts);
            
            // Show the results section
            document.querySelector('.results-section').classList.remove('hidden');
            
            // Enable export button
            if (exportCsvButton) {
                exportCsvButton.disabled = false;
            }
        });
    });
    
    // Export CSV when button is clicked
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', function() {
            if (!currentRiskData || currentRiskData.length === 0) {
                alert('No data to export.');
                return;
            }
            
            const csvContent = convertToCSV(currentRiskData);
            const date = new Date().toISOString().slice(0, 10);
            downloadCSV(csvContent, `payroll-risks-${date}.csv`);
        });
    }
    
    // Export CSV when export button is clicked
    exportCsvButton.addEventListener('click', function() {
        if (currentRiskData.length === 0) {
            alert('No data to export. Please run QA check first.');
            return;
        }
    
        const csvContent = convertToCSV(currentRiskData);
        const date = new Date().toISOString().slice(0, 10);
        downloadCSV(csvContent, `payroll-qa-report-${date}.csv`);
    });
});

// Function to add sample CSV template link
function addSampleCsvTemplate() {
    const sampleLink = document.createElement('a');
    sampleLink.textContent = 'Download Sample CSV Template';
    sampleLink.className = 'sample-link';
    sampleLink.href = '#';
    sampleLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        const sampleContent = 'Department,Task,Task_Completed,Notes\n' +
            'HR,Verify employee data,No,Some data seems outdated\n' +
            'Finance,Confirm budget allocation,Yes,Budget approved on 5/10\n' +
            'IT,Test system integration,No,Found critical issues with API\n' +
            'HR,Update employee handbook,Yes,Completed and verified';
        
        downloadCSV(sampleContent, 'payroll-tasks-template.csv');
    });
    
    // Add near the file input
    csvFileInput.parentNode.insertBefore(sampleLink, csvFileInput.nextSibling);
}

// Call this function when the page loads
addSampleCsvTemplate();