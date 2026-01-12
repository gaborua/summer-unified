/**
 * Summer Unified - Utilidades Frontend
 * Funciones útiles para el frontend
 */

/**
 * Mostrar mensaje de éxito o error
 */
function showMessage(elementId, text, type = 'success') {
    const message = document.getElementById(elementId);
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type} show`;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        message.classList.remove('show');
    }, 5000);
}

/**
 * Limpiar formulario
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.reset();

    // Desmarcar checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Limpiar file inputs
    form.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
    });
}

/**
 * Formatear fecha para mostrar
 */
function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Formatear fecha y hora
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatear moneda boliviana
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'Bs. 0.00';

    return `Bs. ${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Exportar tabla a CSV
 */
function exportTableToCSV(tableId, filename = 'export.csv') {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = '\uFEFF'; // BOM para Excel

    // Headers
    const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent.trim());
    csv += headers.join(',') + '\n';

    // Rows
    table.querySelectorAll('tbody tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
            .map(td => {
                // Limpiar contenido (quitar saltos de línea, etc.)
                let text = td.textContent.trim().replace(/\n/g, ' ');
                // Escapar comillas
                text = text.replace(/"/g, '""');
                // Encerrar en comillas si contiene comas
                if (text.includes(',')) {
                    text = `"${text}"`;
                }
                return text;
            });
        csv += cells.join(',') + '\n';
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Debounce para búsquedas
 */
function debounce(func, wait = 300) {
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

/**
 * Filtrar tabla por búsqueda
 */
function setupTableSearch(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);

    if (!searchInput || !table) return;

    const debouncedSearch = debounce((searchTerm) => {
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

/**
 * Validar archivo antes de subir
 */
function validateFile(fileInput, maxSize = 4 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']) {
    const file = fileInput.files[0];

    if (!file) {
        return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    // Validar tamaño
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Archivo demasiado grande. Máximo: ${maxSize / (1024 * 1024)}MB`
        };
    }

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
        };
    }

    return { valid: true, file };
}

/**
 * Deshabilitar botón durante submit
 */
function setupFormSubmit(formId, submitHandler) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';

        try {
            await submitHandler(form);
        } finally {
            // Rehabilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * Actualizar contador de caracteres
 */
function setupCharacterCounter(textareaId, counterId, maxLength) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);

    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${maxLength}`;

        if (length > maxLength) {
            counter.style.color = 'var(--error)';
        } else {
            counter.style.color = 'var(--text-muted)';
        }
    });
}
