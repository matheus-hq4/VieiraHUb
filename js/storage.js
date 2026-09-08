import { api } from './api.js';

const THEME_STORAGE_KEY = 'vieiratech_hub_theme_v1';

/**
 * Carrega a lista de ferramentas da API do servidor.
 * @returns {Promise<Array>} Lista de ferramentas
 */
export async function loadTools() {
  try {
    if (api.isAuthenticated()) {
      const data = await api.get('/api/tools');
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (error) {
    console.error('[Storage] Erro ao carregar ferramentas do servidor:', error);
  }
  return [];
}

/**
 * Salva a lista de ferramentas no servidor.
 * @param {Array} tools
 */
export async function saveTools(tools) {
  try {
    if (api.isAuthenticated()) {
      return await api.post('/api/tools', tools);
    }
  } catch (error) {
    console.error('[Storage] Erro ao salvar ferramentas no servidor:', error);
    throw error;
  }
}

/**
 * Exclui uma ferramenta do servidor (Admin)
 * @param {string} id
 */
export async function deleteTool(id) {
  try {
    return await api.delete(`/api/tools/${id}`);
  } catch (error) {
    console.error('[Storage] Erro ao excluir ferramenta:', error);
    throw error;
  }
}

/**
 * Carrega a preferência de tema (dark/light)
 * @returns {boolean} true se for tema escuro
 */
export function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/**
 * Salva a preferência de tema
 * @param {boolean} isDark
 */
export function saveTheme(isDark) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch (error) {
    console.error('[Storage] Erro ao salvar tema:', error);
  }
}
