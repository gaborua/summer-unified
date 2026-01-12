/**
 * Summer Unified - API Client
 * Cliente para consumir la API desde el frontend
 */

class APIClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        try {
            const url = new URL(this.baseURL + endpoint, window.location.origin);

            // Agregar parámetros query
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en GET:', error);
            throw error;
        }
    }

    /**
     * POST request con soporte para FormData
     */
    async post(endpoint, data, file = null) {
        try {
            const formData = new FormData();

            // Agregar archivo si existe
            if (file) {
                formData.append('receipt', file);
            }

            // Agregar datos
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    // Si es un array, convertir a JSON string
                    if (Array.isArray(data[key])) {
                        formData.append(key, JSON.stringify(data[key]));
                    } else {
                        formData.append(key, data[key]);
                    }
                }
            });

            const response = await fetch(this.baseURL + endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en POST:', error);
            throw error;
        }
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en PATCH:', error);
            throw error;
        }
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en DELETE:', error);
            throw error;
        }
    }
}

// Crear instancia global
const api = new APIClient();

// También hacer la clase disponible globalmente para new APIClient()
window.APIClient = APIClient;
