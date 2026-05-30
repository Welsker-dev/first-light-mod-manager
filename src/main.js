const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { openUrl } = window.__TAURI__.opener;

// ─── Configurações Gerais ─────────────────────────────────────────────
const NEXUS_GAME_URL = 'https://www.nexusmods.com/007firstlight';
const DISCORD_URL = 'https://discord.gg/aMfk6wgA';
const NEXUS_MOD_ID = '0'; // Defina o ID do mod no Nexus para atualizações automáticas (0 para desativar)
const NEXUS_MOD_URL = NEXUS_MOD_ID !== '0' ? `https://www.nexusmods.com/007firstlight/mods/${NEXUS_MOD_ID}` : NEXUS_GAME_URL;

// ─── Estado global ────────────────────────────────────────────────────
let state = {
  gamePath: '',
  platform: '',
  gameFound: false,
  modInstalled: false,
  modVersion: '',
  backupExists: false,
  selectedModFile: '',
};

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
    const platformLabels = { steam: '🟦 Steam', epic: '🟪 Epic Games', unknown: '❓ Desconhecido' };
    document.getElementById('platform-tag').textContent = platformLabels[info.platform] || '—';
    document.getElementById('game-path-display').textContent = info.found
      ? info.path
      : 'Jogo não encontrado. Configure o caminho manualmente.';
    document.getElementById('sc-platform').textContent = info.platform === 'steam' ? 'Steam' : info.platform === 'epic' ? 'Epic Games' : '—';
    document.getElementById('sc-game').textContent = info.found ? '✅ Instalado' : '❌ Não encontrado';

    // Path no install tab
    document.getElementById('step-game-path-text').textContent = info.found ? info.path : 'Não encontrado — selecione manualmente';
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
    toast('Erro ao detectar o jogo: ' + err, 'error');
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

  if (installed) {
    chip.className = 'status-chip installed';
    chip.querySelector('.chip-text').textContent = 'Mod(s) ativo(s)';
    verChip.style.display = 'flex';
    verText.textContent = `Ativo`;
    scMod.textContent = `Ativo`;
  } else {
    chip.className = 'status-chip not-installed';
    chip.querySelector('.chip-text').textContent = 'Nenhum mod ativo';
    verChip.style.display = 'none';
    scMod.textContent = 'Nenhum mod';
  }

  scBack.textContent = backupExists ? '✅ Disponível' : '—';
  backupStatusText.textContent = backupExists ? '✅ Backup original criado' : '❌ Nenhum backup';

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

  setProgress('Criando backup dos arquivos originais...', 20);
  await sleep(400);
  setProgress('Copiando arquivos do mod...', 55);
  await sleep(300);
  setProgress('Atualizando packagedefinition.txt...', 80);

  try {
    const result = await invoke('install_mod', {
      gamePath: state.gamePath,
      modPath: state.selectedModFile,
    });
    setProgress('Concluído!', 100);
    await sleep(600);
    hideProgress();
    toast(result, 'success');
    await getModStatus();
    // Volta para home
    document.getElementById('nav-home').click();
  } catch (err) {
    hideProgress();
    toast('Erro ao instalar: ' + err, 'error');
    btn.disabled = false;
  }
}

// ─── Desinstalar mod ──────────────────────────────────────────────────
async function uninstallMod() {
  if (!state.gamePath) return;

  const confirmed = confirm('Deseja desinstalar todos os mods e restaurar os arquivos originais do jogo?');
  if (!confirmed) return;

  const btn = document.getElementById('btn-uninstall-main');
  btn.disabled = true;

  try {
    const result = await invoke('uninstall_mod', { gamePath: state.gamePath });
    toast(result, 'success');
    await getModStatus();
  } catch (err) {
    toast('Erro ao desinstalar: ' + err, 'error');
    btn.disabled = false;
  }
}

// ─── Verificar atualizações ───────────────────────────────────────────
async function checkUpdates(showToast = false) {
  if (NEXUS_MOD_ID === '0') {
    if (showToast) toast('Verificação de atualizações desativada (Mod ID não configurado).', 'info');
    return;
  }
  try {
    const result = await invoke('check_updates', { currentVersion: state.modVersion || '0.1.0', modId: NEXUS_MOD_ID });
    if (result.has_update) {
      const banner = document.getElementById('update-banner');
      banner.style.display = 'flex';
      document.getElementById('update-version-text').textContent = `Versão ${result.version} disponível no Nexus Mods.`;
      document.getElementById('btn-download-update').href = result.url;
    } else if (showToast) {
      toast('Você já tem a versão mais recente!', 'success');
    }
  } catch (err) {
    if (showToast) toast('Não foi possível verificar atualizações: ' + err, 'error');
  }
}

// ─── Selecionar arquivo do mod ────────────────────────────────────────
async function browseModFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Arquivos de Mod (.rpkg, .zip)', extensions: ['rpkg', 'zip'] },
      ],
    });
    if (selected) {
      setModFile(selected);
    }
  } catch (err) {
    toast('Erro ao selecionar arquivo: ' + err, 'error');
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
      toast('Pasta do jogo configurada!', 'success');
    }
  } catch (err) {
    toast('Erro ao selecionar pasta: ' + err, 'error');
  }
}

// ─── Abrir pasta do jogo ─────────────────────────────────────────────
async function openGameFolder() {
  try {
    await invoke('open_game_folder', { gamePath: state.gamePath });
  } catch (err) {
    toast('Erro: ' + err, 'error');
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
      toast('Por favor, selecione um arquivo .rpkg ou .zip', 'error');
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
  toast('Configurações salvas!', 'success');
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
    if (!state.backupExists) { toast('Nenhum backup para remover.', 'info'); return; }
    toast('Funcionalidade em desenvolvimento.', 'info');
  });

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
  await detectGame();
  // Verifica atualizações em background (silencioso)
  checkUpdates(false).catch(() => {});
}

window.addEventListener('DOMContentLoaded', init);
