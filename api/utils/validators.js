/**
 * Validadores para datos de entrada
 * Funciones de validación reutilizables
 */

/**
 * Validar campos requeridos
 * @param {Object} data - Objeto con datos a validar
 * @param {Array<string>} requiredFields - Lista de campos requeridos
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            return {
                valid: false,
                error: `El campo '${field}' es requerido`
            };
        }
    }
    return { valid: true };
}

/**
 * Validar que un número sea positivo
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePositiveNumber(value, fieldName = 'campo') {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return {
            valid: false,
            error: `${fieldName} debe ser un número válido`
        };
    }
    
    if (num <= 0) {
        return {
            valid: false,
            error: `${fieldName} debe ser mayor a 0`
        };
    }
    
    return { valid: true };
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            error: 'Email no tiene un formato válido'
        };
    }
    
    return { valid: true };
}

/**
 * Validar teléfono (formato boliviano)
 * @param {string} phone - Teléfono a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePhone(phone) {
    // Limpiar el teléfono de espacios y caracteres especiales
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Validar que tenga entre 7 y 15 dígitos
    if (!/^\d{7,15}$/.test(cleanPhone)) {
        return {
            valid: false,
            error: 'Teléfono debe tener entre 7 y 15 dígitos'
        };
    }
    
    return { valid: true };
}

/**
 * Sanitizar nombre de archivo
 * @param {string} filename - Nombre del archivo original
 * @returns {string} Nombre del archivo sanitizado
 */
function sanitizeFilename(filename) {
    // Remover caracteres peligrosos y espacios
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
}

/**
 * Validar tamaño de archivo
 * @param {number} size - Tamaño del archivo en bytes
 * @param {number} maxSize - Tamaño máximo permitido en bytes
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateFileSize(size, maxSize = 4 * 1024 * 1024) { // 4MB por defecto
    if (size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `El archivo es muy grande. Máximo permitido: ${maxSizeMB}MB`
        };
    }
    
    return { valid: true };
}

/**
 * Validar tipo de archivo
 * @param {string} mimetype - Tipo MIME del archivo
 * @param {Array<string>} allowedTypes - Tipos permitidos
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateFileType(mimetype, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']) {
    if (!allowedTypes.includes(mimetype)) {
        return {
            valid: false,
            error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
        };
    }
    
    return { valid: true };
}

/**
 * Validar rango de fechas
 * @param {string} startDate - Fecha de inicio (ISO string)
 * @param {string} endDate - Fecha de fin (ISO string)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) {
        return {
            valid: false,
            error: 'Fecha de inicio no es válida'
        };
    }
    
    if (isNaN(end.getTime())) {
        return {
            valid: false,
            error: 'Fecha de fin no es válida'
        };
    }
    
    if (start > end) {
        return {
            valid: false,
            error: 'La fecha de inicio debe ser anterior a la fecha de fin'
        };
    }
    
    return { valid: true };
}

/**
 * Validar que un string no esté vacío después de trim
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @param {number} minLength - Longitud mínima
 * @param {number} maxLength - Longitud máxima
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateString(value, fieldName, minLength = 1, maxLength = 255) {
    if (typeof value !== 'string') {
        return {
            valid: false,
            error: `${fieldName} debe ser un texto`
        };
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length < minLength) {
        return {
            valid: false,
            error: `${fieldName} debe tener al menos ${minLength} caracteres`
        };
    }
    
    if (trimmed.length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} no puede tener más de ${maxLength} caracteres`
        };
    }
    
    return { valid: true };
}

/**
 * Validar array no vacío
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateArray(value, fieldName) {
    if (!Array.isArray(value)) {
        return {
            valid: false,
            error: `${fieldName} debe ser un array`
        };
    }
    
    if (value.length === 0) {
        return {
            valid: false,
            error: `${fieldName} no puede estar vacío`
        };
    }
    
    return { valid: true };
}

module.exports = {
    validateRequired,
    validatePositiveNumber,
    validateEmail,
    validatePhone,
    sanitizeFilename,
    validateFileSize,
    validateFileType,
    validateDateRange,
    validateString,
    validateArray
};