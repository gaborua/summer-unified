/**
 * Utilidades para Supabase
 * Cliente configurado y funciones helpers
 */

const { createClient } = require('@supabase/supabase-js');

// Constantes de buckets de storage
const STORAGE_BUCKETS = {
    RECEIPTS: 'receipts',
    DOCUMENTS: 'documents',
    EVENT_IMAGES: 'event-images'
};

// Validar variables de entorno
if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL no está definida en las variables de entorno');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno');
}

// Cliente de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/**
 * Obtener URL pública de un archivo en storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} filename - Nombre del archivo
 * @returns {string} URL pública del archivo
 */
function getPublicUrl(bucket, filename) {
    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);
        return data.publicUrl;
    } catch (error) {
        console.error(`Error obteniendo URL pública para ${bucket}/${filename}:`, error);
        return null;
    }
}

/**
 * Subir archivo al storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} filename - Nombre del archivo
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} contentType - Tipo de contenido
 * @returns {Promise<string>} URL pública del archivo subido
 */
async function uploadFile(bucket, filename, fileBuffer, contentType) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, fileBuffer, {
                contentType,
                cacheControl: '3600', // 1 hora
                upsert: false // No sobrescribir archivos existentes
            });

        if (error) {
            throw error;
        }

        return getPublicUrl(bucket, filename);
    } catch (error) {
        console.error(`Error subiendo archivo ${filename} a ${bucket}:`, error);
        throw new Error(`Error subiendo archivo: ${error.message}`);
    }
}

/**
 * Eliminar archivo del storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
async function deleteFile(bucket, filename) {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filename]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error(`Error eliminando archivo ${filename} de ${bucket}:`, error);
        return false;
    }
}

/**
 * Verificar si existe un archivo en storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<boolean>} True si existe el archivo
 */
async function fileExists(bucket, filename) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list('', {
                limit: 1,
                search: filename
            });

        if (error) {
            throw error;
        }

        return data.some(file => file.name === filename);
    } catch (error) {
        console.error(`Error verificando existencia de ${filename} en ${bucket}:`, error);
        return false;
    }
}

/**
 * Test de conexión a Supabase
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('count')
            .limit(1);

        if (error) {
            throw error;
        }

        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error);
        return false;
    }
}

module.exports = {
    supabase,
    STORAGE_BUCKETS,
    getPublicUrl,
    uploadFile,
    deleteFile,
    fileExists,
    testConnection
};