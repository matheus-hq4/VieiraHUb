import { defaultToolsList } from './data.js';

const TOOLS_STORAGE_KEY = 'vieiratech_hub_tools_list_v1';
const THEME_STORAGE_KEY = 'vieiratech_hub_theme_v1';

/**
 * Carrega a lista de ferramentas do localStorage ou retorna o padrão.
 * @returns {Array} Lista de ferramentas
 */
export function loadTools() {
  try {
    const saved = localStorage.getItem(TOOLS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Erro ao ler ferramentas do localStorage:', error);
  }
  return [...defaultToolsList];
}

/**
 * Salva a lista de ferramentas no localStorage.
 * @param {Array} tools
 */
export function saveTools(tools) {
  try {
    localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
  } catch (error) {
    console.error('Erro ao salvar ferramentas no localStorage:', error);
  }
}

/**
 * Restaura a lista de ferramentas para os valores padrão.
 * @returns {Array} Lista padrão de ferramentas
 */
export function resetToDefaults() {
  const defaults = [...defaultToolsList];
  saveTools(defaults);
  return defaults;
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
    console.error('Erro ao salvar tema:', error);
  }
}
