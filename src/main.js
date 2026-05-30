const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { openUrl } = window.__TAURI__.opener;

// ─── Configurações Gerais ─────────────────────────────────────────────
const NEXUS_GAME_URL = 'https://www.nexusmods.com/007firstlight';
const DISCORD_URL = 'https://discord.gg/aMfk6wgA';
const NEXUS_MOD_ID = '0'; // Defina o ID do mod no Nexus para atualizações automáticas (0 para desativar)
const NEXUS_MOD_URL = NEXUS_MOD_ID !== '0' ? `https://www.nexusmods.com/007firstlight/mods/${NEXUS_MOD_ID}` : NEXUS_GAME_URL;

// ─── Dicionário de Traduções (i18n) ──────────────────────────────────
const translations = {
  en: {
    nav_home: "Home",
    nav_install: "Install Mod",
    nav_settings: "Settings",
    nav_about: "About",
    subtitle_home: "Mod Manager (.rpkg)",
    detecting: "Detecting...",
    scanning: "Scanning for installation...",
    checking: "Checking...",
    btn_install_main: "Install Mod",
    btn_uninstall: "Uninstall",
    btn_open_folder: "Open Folder",
    new_version: "New version available!",
    btn_download: "Download",
    lbl_game: "Game",
    lbl_mods: "Mods",
    lbl_backup: "Backup",
    lbl_platform: "Platform",
    val_not_installed: "Not installed",
    title_install: "Install Mod",
    subtitle_install: "Select the mod's .rpkg or .zip file",
    step1_title: "Game Detected",
    step1_not_found: "Not found",
    step1_btn: "Select manually",
    step2_title: "Mod File",
    step2_label: "Drag and drop <strong>.rpkg</strong> or <strong>.zip</strong> file here",
    step2_or: "or",
    step2_btn: "Browse file",
    step3_title: "Install",
    step3_warning: "A backup of the original files will be automatically created before installation.",
    btn_install_mod: "Install Mod",
    progress_label: "Installing...",
    title_settings: "Settings",
    subtitle_settings: "Customize the Mod Manager",
    settings_lang_title: "Language / Idioma",
    settings_lang_label: "Select Language / Escolha o Idioma",
    group_game_path: "Game Path",
    lbl_game_directory: "007: First Light Directory",
    btn_browse: "Browse",
    lbl_api_key: "API Key (optional — to check for updates)",
    placeholder_api_key: "Your Nexus Mods API key...",
    lbl_auto_update: "Check for updates automatically",
    group_backup: "Backup",
    lbl_backup_status: "Original backup",
    btn_delete_backup: "Delete backup",
    btn_save_settings: "Save Settings",
    btn_check_updates_now: "Check for updates now",
    title_about: "About",
    subtitle_about: "Open Source Mod Manager",
    about_version: "Version 0.1.0",
    about_desc: "Open-source mod manager for <strong>007: First Light</strong>. Safely and easily install, update, and remove .rpkg files without needing technical knowledge.",
    abt_discord_title: "Discord Community",
    abt_discord_sub: "Visit the official server",
    abt_tech_title: "Technologies used",
    about_footer: "Open Source · 2026 · MIT / Apache 2.0 License",
    
    // Dynamic keys in JS
    active_mods: "Active Mod(s)",
    no_active_mods: "No active mods",
    no_mods: "No mods",
    active: "Active",
    available: "Available",
    backup_created: "Backup created",
    no_backup: "No backup found",
    game_installed: "✅ Installed",
    game_not_found: "❌ Not found",
    scanning_not_found: "Not found — select manually",
    toast_settings_saved: "Settings saved!",
    toast_game_dir_configured: "Game directory configured!",
    confirm_uninstall: "Do you want to uninstall all mods and restore original game files?",
    progress_backup: "Creating backup of original files...",
    progress_copy: "Copying mod files...",
    progress_patch: "Patching packagedefinition.txt...",
    progress_done: "Completed!",
    err_detecting: "Error detecting game: ",
    err_select_file: "Error selecting file: ",
    err_select_dir: "Error selecting directory: ",
    err_install: "Error installing mod: ",
    err_uninstall: "Error uninstalling: ",
    err_check_updates: "Could not check for updates: ",
    updates_disabled: "Updates check disabled (Mod ID not configured).",
    toast_no_backup: "No backup to remove.",
    toast_dev_feature: "Feature in development.",
    drop_error_ext: "Please select a .rpkg or .zip file",
    update_banner_ver: "Version {version} available on Nexus Mods.",
    toast_latest_ver: "You already have the latest version!",
    game_not_found_manual: "Game not found. Configure path manually.",
    steam_label: "🟦 Steam",
    epic_label: "🟪 Epic Games",
    unknown_label: "❓ Unknown"
  },
  pt: {
    nav_home: "Início",
    nav_install: "Instalar Mod",
    nav_settings: "Configurações",
    nav_about: "Sobre",
    subtitle_home: "Gerenciador de Mods (.rpkg)",
    detecting: "Detectando...",
    scanning: "Procurando instalação...",
    checking: "Verificando...",
    btn_install_main: "Instalar Mod",
    btn_uninstall: "Desinstalar",
    btn_open_folder: "Abrir Pasta",
    new_version: "Nova versão disponível!",
    btn_download: "Baixar",
    lbl_game: "Jogo",
    lbl_mods: "Mods",
    lbl_backup: "Backup",
    lbl_platform: "Plataforma",
    val_not_installed: "Não instalado",
    title_install: "Instalar Mod",
    subtitle_install: "Selecione o arquivo .rpkg ou .zip do mod",
    step1_title: "Jogo Detectado",
    step1_not_found: "Não encontrado",
    step1_btn: "Selecionar manualmente",
    step2_title: "Arquivo do Mod",
    step2_label: "Arraste o arquivo <strong>.rpkg</strong> ou <strong>.zip</strong> aqui",
    step2_or: "ou",
    step2_btn: "Procurar arquivo",
    step3_title: "Instalar",
    step3_warning: "Um backup dos arquivos originais será criado automaticamente antes da instalação.",
    btn_install_mod: "Instalar Mod",
    progress_label: "Instalando...",
    title_settings: "Configurações",
    subtitle_settings: "Personalize o Mod Manager",
    settings_lang_title: "Language / Idioma",
    settings_lang_label: "Select Language / Escolha o Idioma",
    group_game_path: "Caminho do Jogo",
    lbl_game_directory: "Diretório do 007: First Light",
    btn_browse: "Alterar",
    lbl_api_key: "API Key (opcional — para verificar atualizações)",
    placeholder_api_key: "Sua API key do Nexus Mods...",
    lbl_auto_update: "Verificar atualizações automaticamente",
    group_backup: "Backup",
    lbl_backup_status: "Backup original",
    btn_delete_backup: "Remover backup",
    btn_save_settings: "Salvar configurações",
    btn_check_updates_now: "Verificar atualizações agora",
    title_about: "Sobre",
    subtitle_about: "Gerenciador de Mods Open Source",
    about_version: "Versão 0.1.0",
    about_desc: "Gerenciador de mods de código aberto para o <strong>007: First Light</strong>. Instale, atualize e remova arquivos .rpkg de forma simples e segura, sem precisar de conhecimento técnico.",
    abt_discord_title: "Comunidade Discord",
    abt_discord_sub: "Visite o servidor oficial",
    abt_tech_title: "Tecnologias utilizadas",
    about_footer: "Open Source · 2026 · Licença MIT / Apache 2.0",
    
    // Dynamic keys in JS
    active_mods: "Mod(s) ativo(s)",
    no_active_mods: "Nenhum mod ativo",
    no_mods: "Nenhum mod",
    active: "Ativo",
    available: "Disponível",
    backup_created: "Backup original criado",
    no_backup: "Nenhum backup",
    game_installed: "✅ Instalado",
    game_not_found: "❌ Não encontrado",
    scanning_not_found: "Não encontrado — selecione manualmente",
    toast_settings_saved: "Configurações salvas!",
    toast_game_dir_configured: "Pasta do jogo configurada!",
    confirm_uninstall: "Deseja desinstalar todos os mods e restaurar os arquivos originais do jogo?",
    progress_backup: "Criando backup dos arquivos originais...",
    progress_copy: "Copiando arquivos do mod...",
    progress_patch: "Atualizando packagedefinition.txt...",
    progress_done: "Concluído!",
    err_detecting: "Erro ao detectar o jogo: ",
    err_select_file: "Erro ao selecionar arquivo: ",
    err_select_dir: "Erro ao selecionar pasta: ",
    err_install: "Erro ao instalar: ",
    err_uninstall: "Erro ao desinstalar: ",
    err_check_updates: "Não foi possível verificar atualizações: ",
    updates_disabled: "Verificação de atualizações desativada (Mod ID não configurado).",
    toast_no_backup: "Nenhum backup para remover.",
    toast_dev_feature: "Funcionalidade em desenvolvimento.",
    drop_error_ext: "Por favor, selecione um arquivo .rpkg ou .zip",
    update_banner_ver: "Versão {version} disponível no Nexus Mods.",
    toast_latest_ver: "Você já tem a versão mais recente!",
    game_not_found_manual: "Jogo não encontrado. Configure o caminho manualmente.",
    steam_label: "🟦 Steam",
    epic_label: "🟪 Epic Games",
    unknown_label: "❓ Desconhecido"
  }
};

// ─── Estado global ────────────────────────────────────────────────────
let state = {
  gamePath: '',
  platform: '',
  gameFound: false,
  modInstalled: false,
  modVersion: '',
  backupExists: false,
  selectedModFile: '',
  language: 'en' // Default language
};

// ─── Utilitários de Tradução ──────────────────────────────────────────
function applyLanguage(lang) {
  state.language = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (translations[lang][key].includes('<strong') || translations[lang][key].includes('<span') || translations[lang][key].includes('<strong>')) {
        el.innerHTML = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  const select = document.getElementById('select-language');
  if (select) {
    select.value = lang;
  }
}

// ─── Utilitários ──────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${msg}</span>
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('fadeout');
    el.addEventListener('animationend', () => el.remove());
  }, 4000);
}

function setProgress(label, percent) {
  const area = document.getElementById('progress-area');
  const bar  = document.getElementById('progress-bar');
  const lbl  = document.getElementById('progress-label');
  area.style.display = 'block';
  lbl.textContent = label;
  bar.style.width = percent + '%';
}

function hideProgress() {
  document.getElementById('progress-area').style.display = 'none';
  document.getElementById('progress-bar').style.width = '0%';
}

// ─── Navegação por abas ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ─── Detectar jogo ────────────────────────────────────────────────────
async function detectGame() {
  try {
    const info = await invoke('detect_game');
    state.gamePath  = info.path;
    state.platform  = info.platform;
    state.gameFound = info.found;

    // Atualiza UI
    const lang = state.language;
    const platformLabels = { steam: '🟦 Steam', epic: '🟪 Epic Games', unknown: translations[lang].unknown_label };
    document.getElementById('platform-tag').textContent = platformLabels[info.platform] || '—';
    document.getElementById('game-path-display').textContent = info.found
      ? info.path
      : translations[lang].game_not_found_manual;
    document.getElementById('sc-platform').textContent = info.platform === 'steam' ? 'Steam' : info.platform === 'epic' ? 'Epic Games' : '—';
    document.getElementById('sc-game').textContent = info.found ? translations[lang].game_installed : translations[lang].game_not_found;

    // Path no install tab
    document.getElementById('step-game-path-text').textContent = info.found ? info.path : translations[lang].scanning_not_found;
    document.getElementById('input-game-path').value = info.path || '';

    // Botões
    document.getElementById('btn-open-folder').disabled = !info.found;

    if (info.found) {
      await getModStatus();
    } else {
      document.getElementById('game-path-display').style.color = 'var(--danger)';
      setModStatusUI(false, '', false);
    }
  } catch (err) {
    console.error('detect_game error:', err);
    toast(translations[state.language].err_detecting + err, 'error');
  }
}

// ─── Status do mod ────────────────────────────────────────────────────
async function getModStatus() {
  if (!state.gamePath) return;
  try {
    const status = await invoke('get_mod_status', { gamePath: state.gamePath });
    state.modInstalled  = status.installed;
    state.modVersion    = status.version;
    state.backupExists  = status.backup_exists;
    setModStatusUI(status.installed, status.version, status.backup_exists);
  } catch (err) {
    console.error('get_mod_status error:', err);
  }
}

function setModStatusUI(installed, version, backupExists) {
  const chip    = document.getElementById('mod-status-chip');
  const verChip = document.getElementById('version-chip');
  const verText = document.getElementById('installed-version-text');
  const scMod   = document.getElementById('sc-mod');
  const scBack  = document.getElementById('sc-backup');
  const backupStatusText = document.getElementById('backup-status-text');
  const lang = state.language;

  if (installed) {
    chip.className = 'status-chip installed';
    chip.querySelector('.chip-text').textContent = translations[lang].active_mods;
    verChip.style.display = 'flex';
    verText.textContent = translations[lang].active;
    scMod.textContent = translations[lang].active;
  } else {
    chip.className = 'status-chip not-installed';
    chip.querySelector('.chip-text').textContent = translations[lang].no_active_mods;
    verChip.style.display = 'none';
    scMod.textContent = translations[lang].no_mods;
  }

  scBack.textContent = backupExists ? '✅ ' + translations[lang].available : '—';
  backupStatusText.textContent = backupExists ? '✅ ' + translations[lang].backup_created : '❌ ' + translations[lang].no_backup;

  // Botões de ação
  const btnInstallMain   = document.getElementById('btn-install-main');
  const btnUninstallMain = document.getElementById('btn-uninstall-main');

  btnInstallMain.disabled   = !state.gameFound;
  btnUninstallMain.disabled = !backupExists;
  updateInstallButtonState();
}

// ─── Instalar mod ─────────────────────────────────────────────────────
async function installMod() {
  if (!state.gamePath || !state.selectedModFile) return;

  const btn = document.getElementById('btn-do-install');
  btn.disabled = true;
  const lang = state.language;

  setProgress(translations[lang].progress_backup, 20);
  await sleep(400);
  setProgress(translations[lang].progress_copy, 55);
  await sleep(300);
  setProgress(translations[lang].progress_patch, 80);

  try {
    const result = await invoke('install_mod', {
      gamePath: state.gamePath,
      modPath: state.selectedModFile,
      lang: state.language
    });
    setProgress(translations[lang].progress_done, 100);
    await sleep(600);
    hideProgress();
    toast(result, 'success');
    await getModStatus();
    // Volta para home
    document.getElementById('nav-home').click();
  } catch (err) {
    hideProgress();
    toast(translations[state.language].err_install + err, 'error');
    btn.disabled = false;
  }
}

// ─── Desinstalar mod ──────────────────────────────────────────────────
async function uninstallMod() {
  if (!state.gamePath) return;

  const lang = state.language;
  const confirmed = confirm(translations[lang].confirm_uninstall);
  if (!confirmed) return;

  const btn = document.getElementById('btn-uninstall-main');
  btn.disabled = true;

  try {
    const result = await invoke('uninstall_mod', { gamePath: state.gamePath, lang: state.language });
    toast(result, 'success');
    await getModStatus();
  } catch (err) {
    toast(translations[state.language].err_uninstall + err, 'error');
    btn.disabled = false;
  }
}

// ─── Verificar atualizações ───────────────────────────────────────────
async function checkUpdates(showToast = false) {
  const lang = state.language;
  if (NEXUS_MOD_ID === '0') {
    if (showToast) toast(translations[lang].updates_disabled, 'info');
    return;
  }
  try {
    const result = await invoke('check_updates', { currentVersion: state.modVersion || '0.1.0', modId: NEXUS_MOD_ID });
    if (result.has_update) {
      const banner = document.getElementById('update-banner');
      banner.style.display = 'flex';
      document.getElementById('update-version-text').textContent = translations[lang].update_banner_ver.replace('{version}', result.version);
      document.getElementById('btn-download-update').href = result.url;
    } else if (showToast) {
      toast(translations[lang].toast_latest_ver, 'success');
    }
  } catch (err) {
    if (showToast) toast(translations[state.language].err_check_updates + err, 'error');
  }
}

// ─── Selecionar arquivo do mod ────────────────────────────────────────
async function browseModFile() {
  try {
    const lang = state.language;
    const selected = await open({
      multiple: false,
      filters: [
        { name: translations[lang].step2_title, extensions: ['rpkg', 'zip'] },
      ],
    });
    if (selected) {
      setModFile(selected);
    }
  } catch (err) {
    toast(translations[state.language].err_select_file + err, 'error');
  }
}

function setModFile(filePath) {
  state.selectedModFile = filePath;
  const name = filePath.split(/[\\/]/).pop();

  document.getElementById('drop-zone').style.display = 'none';
  const display = document.getElementById('selected-file-display');
  display.style.display = 'flex';
  document.getElementById('selected-file-name').textContent = name;
  updateInstallButtonState();
}

function clearModFile() {
  state.selectedModFile = '';
  document.getElementById('drop-zone').style.display = 'block';
  document.getElementById('selected-file-display').style.display = 'none';
  updateInstallButtonState();
}

function updateInstallButtonState() {
  const btn = document.getElementById('btn-do-install');
  btn.disabled = !state.gamePath || !state.selectedModFile;
}

// ─── Selecionar pasta do jogo manualmente ────────────────────────────
async function selectGamePath() {
  try {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      state.gamePath  = selected;
      state.gameFound = true;
      document.getElementById('game-path-display').textContent = selected;
      document.getElementById('step-game-path-text').textContent = selected;
      document.getElementById('input-game-path').value = selected;
      document.getElementById('btn-open-folder').disabled = false;
      await getModStatus();
      toast(translations[state.language].toast_game_dir_configured, 'success');
    }
  } catch (err) {
    toast(translations[state.language].err_select_dir + err, 'error');
  }
}

// ─── Abrir pasta do jogo ─────────────────────────────────────────────
async function openGameFolder() {
  try {
    await invoke('open_game_folder', { gamePath: state.gamePath });
  } catch (err) {
    toast(translations[state.language].err_select_dir + err, 'error');
  }
}

// ─── Links externos ───────────────────────────────────────────────────
async function openLink(url) {
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank');
  }
}

// ─── Drag & drop ──────────────────────────────────────────────────────
function setupDropZone() {
  const zone = document.getElementById('drop-zone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.rpkg') || file.name.endsWith('.zip'))) {
      setModFile(file.path || file.name);
    } else {
      toast(translations[state.language].drop_error_ext, 'error');
    }
  });
}

// ─── Salvar configurações ─────────────────────────────────────────────
function saveSettings() {
  const path = document.getElementById('input-game-path').value.trim();
  if (path) {
    state.gamePath  = path;
    state.gameFound = true;
    document.getElementById('game-path-display').textContent = path;
    document.getElementById('step-game-path-text').textContent = path;
  }
  toast(translations[state.language].toast_settings_saved, 'success');
}

// ─── Helpers ─────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Event listeners ──────────────────────────────────────────────────
function bindEvents() {
  // Home
  document.getElementById('btn-install-main').addEventListener('click', () => {
    document.getElementById('nav-install').click();
  });
  document.getElementById('btn-uninstall-main').addEventListener('click', uninstallMod);
  document.getElementById('btn-open-folder').addEventListener('click', openGameFolder);

  // Install tab
  document.getElementById('btn-browse-mod').addEventListener('click', browseModFile);
  document.getElementById('drop-zone').addEventListener('click', browseModFile);
  document.getElementById('btn-clear-file').addEventListener('click', clearModFile);
  document.getElementById('btn-do-install').addEventListener('click', installMod);
  document.getElementById('btn-manual-path').addEventListener('click', selectGamePath);

  // Settings
  document.getElementById('btn-choose-path').addEventListener('click', selectGamePath);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-check-now').addEventListener('click', () => checkUpdates(true));
  document.getElementById('btn-delete-backup').addEventListener('click', async () => {
    if (!state.backupExists) { toast(translations[state.language].toast_no_backup, 'info'); return; }
    toast(translations[state.language].toast_dev_feature, 'info');
  });

  // Language Selection Listener
  const selectLang = document.getElementById('select-language');
  if (selectLang) {
    selectLang.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('language', selectedLang);
      applyLanguage(selectedLang);
      getModStatus();
      detectGame();
    });
  }

  // Update banner
  document.getElementById('btn-download-update').addEventListener('click', e => {
    e.preventDefault();
    openLink(NEXUS_MOD_URL);
  });

  // About links
  document.getElementById('abt-discord').addEventListener('click', e => { e.preventDefault(); openLink(DISCORD_URL); });
  document.getElementById('abt-nexus').addEventListener('click',   e => { e.preventDefault(); openLink(NEXUS_GAME_URL); });
  document.getElementById('link-discord').addEventListener('click', e => { e.preventDefault(); openLink(DISCORD_URL); });
  document.getElementById('link-nexus').addEventListener('click',   e => { e.preventDefault(); openLink(NEXUS_GAME_URL); });
}

// ─── Init ─────────────────────────────────────────────────────────────
async function init() {
  bindEvents();
  setupDropZone();
  // Load persisted language
  state.language = localStorage.getItem('language') || 'en';
  applyLanguage(state.language);
  await detectGame();
  checkUpdates(false).catch(() => {});
}

window.addEventListener('DOMContentLoaded', init);
