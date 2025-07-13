const AppState = {
    students: [],
    editingIndex: -1,
    formElements: {},
    validationRules: {
        name: /^[a-zA-Z\s]{2,50}$/,
        studentId: /^[A-Za-z0-9]{3,20}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[0-9]{10}$/
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    cacheFormElements();
    loadStoredData();
    bindEventListeners();
    refreshDisplay();
}

function cacheFormElements() {
    AppState.formElements = {
        form: document.getElementById('registrationForm'),
        fullName: document.getElementById('fullName'),
        studentID: document.getElementById('studentID'),
        emailAddress: document.getElementById('emailAddress'),
        phoneNumber: document.getElementById('phoneNumber'),
        submitButton: document.getElementById('submitButton'),
        cancelButton: document.getElementById('cancelButton'),
        tableBody: document.getElementById('studentTableBody'),
        emptyState: document.getElementById('emptyState'),
        totalCount: document.getElementById('totalCount'),
        searchQuery: document.getElementById('searchQuery')
    };
}

function bindEventListeners() {
    AppState.formElements.form.addEventListener('submit', handleFormSubmission);
    AppState.formElements.cancelButton.addEventListener('click', cancelEdit);
}

function handleFormSubmission(event) {
    event.preventDefault();
    if (!validateAllFields()) {
        return;
    }
    const studentData = {
        name: AppState.formElements.fullName.value.trim(),
        id: AppState.formElements.studentID.value.trim(),
        email: AppState.formElements.emailAddress.value.trim(),
        phone: AppState.formElements.phoneNumber.value.trim(),
        timestamp: new Date().toISOString()
    };
    if (AppState.editingIndex >= 0) {
        updateExistingStudent(studentData);
    } else {
        addNewStudent(studentData);
    }
    persistData();
    refreshDisplay();
    resetForm();
}

function validateAllFields() {
    let allValid = true;
    const validations = [
        { field: 'fullName', rule: 'name', message: 'Name must be 2-50 characters, letters only' },
        { field: 'studentID', rule: 'studentId', message: 'Student ID must be 3-20 characters, alphanumeric' },
        { field: 'emailAddress', rule: 'email', message: 'Please enter a valid email address' },
        { field: 'phoneNumber', rule: 'phone', message: 'Phone number must be exactly 10 digits' }
    ];
    validations.forEach(validation => {
        const value = AppState.formElements[validation.field].value.trim();
        const isValid = AppState.validationRules[validation.rule].test(value);
        if (!isValid) {
            showFieldError(validation.field, validation.message);
            allValid = false;
        } else {
            clearFieldError(validation.field);
        }
    });
    if (allValid) {
        const studentId = AppState.formElements.studentID.value.trim();
        const isDuplicate = AppState.students.some((student, index) => 
            student.id === studentId && index !== AppState.editingIndex
        );
        if (isDuplicate) {
            showFieldError('studentID', 'This Student ID is already registered');
            allValid = false;
        }
    }
    return allValid;
}

function showFieldError(fieldName, message) {
    const input = AppState.formElements[fieldName];
    const validationMessage = input.nextElementSibling;
    input.classList.add('invalid');
    if (validationMessage && validationMessage.classList.contains('validation-message')) {
        validationMessage.textContent = message;
        validationMessage.classList.add('visible');
    }
}

function clearFieldError(fieldName) {
    const input = AppState.formElements[fieldName];
    const validationMessage = input.nextElementSibling;
    input.classList.remove('invalid');
    if (validationMessage && validationMessage.classList.contains('validation-message')) {
        validationMessage.classList.remove('visible');
    }
}

function addNewStudent(studentData) {
    AppState.students.push(studentData);
    showNotification('Student registered successfully!', 'success');
}

function updateExistingStudent(studentData) {
    AppState.students[AppState.editingIndex] = studentData;
    showNotification('Student information updated successfully!', 'success');
}

function refreshDisplay() {
    updateStudentTable();
    updateAnalytics();
}

function updateStudentTable() {
    const tbody = AppState.formElements.tableBody;
    const emptyState = AppState.formElements.emptyState;
    if (AppState.students.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';
    tbody.innerHTML = AppState.students.map((student, index) => `
        <tr class="table-row">
            <td class="table-cell">${index + 1}</td>
            <td class="table-cell">${student.name}</td>
            <td class="table-cell">${student.id}</td>
            <td class="table-cell">${student.email}</td>
            <td class="table-cell">${student.phone}</td>
            <td class="table-cell">
                <div class="action-group">
                    <button class="btn btn-edit btn-small" onclick="editStudent(${index})">Edit</button>
                    <button class="btn btn-delete btn-small" onclick="removeStudent(${index})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateAnalytics() {
    AppState.formElements.totalCount.textContent = AppState.students.length;
}

window.editStudent = function(index) {
    AppState.editingIndex = index;
    const student = AppState.students[index];
    AppState.formElements.fullName.value = student.name;
    AppState.formElements.studentID.value = student.id;
    AppState.formElements.emailAddress.value = student.email;
    AppState.formElements.phoneNumber.value = student.phone;
    AppState.formElements.submitButton.textContent = 'Update Student';
    AppState.formElements.cancelButton.style.display = 'inline-block';
    AppState.formElements.form.scrollIntoView({ behavior: 'smooth' });
}

window.removeStudent = function(index) {
    if (confirm('Are you sure you want to remove this student from the system?')) {
        AppState.students.splice(index, 1);
        persistData();
        refreshDisplay();
        showNotification('Student removed successfully!', 'success');
    }
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    AppState.editingIndex = -1;
    AppState.formElements.form.reset();
    AppState.formElements.submitButton.textContent = 'Register Student';
    AppState.formElements.cancelButton.style.display = 'none';
    const inputs = document.querySelectorAll('.form-input');
    const validations = document.querySelectorAll('.validation-message');
    inputs.forEach(input => input.classList.remove('invalid'));
    validations.forEach(validation => validation.classList.remove('visible'));
}

window.performSearch = function() {
    const searchTerm = AppState.formElements.searchQuery.value.toLowerCase();
    const rows = document.querySelectorAll('.table-row');
    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
}

function persistData() {
    try {
        localStorage.setItem('smportal_v1_students', JSON.stringify(AppState.students));
    } catch (error) {
        showNotification('Error saving data to storage!', 'error');
    }
}

function loadStoredData() {
    try {
        const stored = localStorage.getItem('smportal_v1_students');
        if (stored) {
            AppState.students = JSON.parse(stored);
        }
    } catch (error) {
        showNotification('Error loading saved data!', 'error');
        AppState.students = [];
    }
}

window.exportStudentData = function() {
    if (AppState.students.length === 0) {
        showNotification('No student data available to export!', 'error');
        return;
    }
    const csvHeaders = '\uFEFFFull Name,Student ID,Email Address,Phone Number,Registration Date\n';
    const csvData = AppState.students.map(student => {
        const date = new Date(student.timestamp).toLocaleDateString();
        return `"${student.name}","${student.id}","${student.email}","${student.phone}","${date}"`;
    }).join('\n');
    const csvContent = csvHeaders + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `student_database_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    showNotification('Student data exported successfully!', 'success');
}

window.clearAllData = function() {
    if (confirm('Warning: This will permanently delete all student records. This action cannot be undone. Are you sure?')) {
        AppState.students = [];
        persistData();
        refreshDisplay();
        resetForm();
        showNotification('All student data has been cleared!', 'success');
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('alertNotification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}
