const callForm = document.getElementById('call-form');
const callButton = document.getElementById('call-button');
const phoneNumberInput = document.getElementById('phone-number');
const systemPromptInput = document.getElementById('system-prompt');
const statusDiv = document.getElementById('status');
const spinner = callButton.querySelector('.spinner');
const buttonText = callButton.querySelector('.button-text');

function setFormDisabled(disabled) {
    callButton.disabled = disabled;
    phoneNumberInput.disabled = disabled;
    systemPromptInput.disabled = disabled;
    if (disabled) {
        buttonText.textContent = 'Выполняется...';
        spinner.style.display = 'block';
    } else {
        buttonText.textContent = 'Позвонить';
        spinner.style.display = 'none';
    }
}

function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = 'status-' + type; // e.g., status-info, status-success, status-error
}

callForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const phoneNumber = phoneNumberInput.value;
    const systemPrompt = systemPromptInput.value;

    setFormDisabled(true);
    showStatus(`Инициируем звонок на номер ${phoneNumber}...`, 'info');

    fetch('/call', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            phoneNumber: phoneNumber,
            systemPrompt: systemPrompt
        }),
    })
    .then(response => {
        if (!response.ok) {
            // Try to get error message from body, otherwise use status text
            return response.json().then(err => {
                throw new Error(err.message || response.statusText);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if (data.success) {
            showStatus(`Звонок на номер ${phoneNumber} успешно начат.`, 'success');
        } else {
            // This path might not be taken if server sends non-2xx for errors
            showStatus(`Ошибка: ${data.message}`, 'error');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showStatus(`Ошибка: ${error.message}`, 'error');
    })
    .finally(() => {
        // Re-enable form after a short delay to allow user to see the success message
        setTimeout(() => {
            setFormDisabled(false);
        }, 3000);
    });
}); 