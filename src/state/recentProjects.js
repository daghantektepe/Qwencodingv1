// Son açılan projeler (yalnızca bu bilgisayarda, localStorage). İlk kayıt = en son açılan.
const KEY = 'openscriv:recent-projects:v1';
const MAX = 8;

export function loadRecent() {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((p) => p && typeof p.path === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Liste kaydedilemezse yalnızca "son projeler" kaybolur; proje verisi etkilenmez.
  }
  return list;
}

export function rememberProject(path, name) {
  const rest = loadRecent().filter((p) => p.path !== path);
  return saveRecent([{ path, name, openedAt: new Date().toISOString() }, ...rest].slice(0, MAX));
}

export function forgetProject(path) {
  return saveRecent(loadRecent().filter((p) => p.path !== path));
}
