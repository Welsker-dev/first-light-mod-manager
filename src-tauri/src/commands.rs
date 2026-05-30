use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

// ─── Estruturas de dados ───────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct GameInfo {
    pub found: bool,
    pub path: String,
    pub platform: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ModStatus {
    pub installed: bool,
    pub version: String,
    pub backup_exists: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NexusRelease {
    pub version: String,
    pub url: String,
    pub has_update: bool,
}

// ─── detect_game ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn detect_game() -> GameInfo {
    if let Some(path) = find_steam_game() {
        return GameInfo { found: true, path, platform: "steam".into() };
    }
    if let Some(path) = find_epic_game() {
        return GameInfo { found: true, path, platform: "epic".into() };
    }
    GameInfo { found: false, path: String::new(), platform: "unknown".into() }
}

fn find_steam_game() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let steam_key = hklm
            .open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam")
            .or_else(|_| hklm.open_subkey("SOFTWARE\\Valve\\Steam"))
            .ok()?;

        let steam_path: String = steam_key.get_value("InstallPath").ok()?;
        let libs = get_steam_library_paths(&steam_path);

        for lib in &libs {
            let candidates = [
                format!("{}\\steamapps\\common\\007 First Light", lib),
                format!("{}\\steamapps\\common\\007FirstLight", lib),
                format!("{}\\steamapps\\common\\Project 007", lib),
            ];
            for c in &candidates {
                if Path::new(c).exists() {
                    return Some(c.clone());
                }
            }
        }
        None
    }
    #[cfg(not(target_os = "windows"))]
    None
}

fn get_steam_library_paths(steam_path: &str) -> Vec<String> {
    let mut paths = vec![steam_path.to_string()];
    let vdf = format!("{}\\steamapps\\libraryfolders.vdf", steam_path);
    if let Ok(content) = fs::read_to_string(&vdf) {
        for line in content.lines() {
            let line = line.trim();
            if line.contains("\"path\"") {
                let parts: Vec<&str> = line.splitn(4, '"').collect();
                if parts.len() >= 4 {
                    let p = parts[3].replace("\\\\", "\\");
                    if !p.is_empty() { paths.push(p); }
                }
            }
        }
    }
    paths
}

fn find_epic_game() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let epic_key = hklm
            .open_subkey("SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher")
            .or_else(|_| hklm.open_subkey("SOFTWARE\\Epic Games\\EpicGamesLauncher"))
            .ok()?;

        let base: String = epic_key.get_value("AppDataPath").ok()?;
        let manifests = PathBuf::from(&base).parent()?.join("Manifests");
        if !manifests.exists() { return None; }

        for entry in fs::read_dir(&manifests).ok()? {
            let entry = entry.ok()?;
            let content = fs::read_to_string(entry.path()).ok()?;
            if content.contains("007") || content.contains("Project007") {
                if let Some(loc) = extract_json_field(&content, "InstallLocation") {
                    if Path::new(&loc).exists() { return Some(loc); }
                }
            }
        }
        None
    }
    #[cfg(not(target_os = "windows"))]
    None
}

fn extract_json_field(json: &str, field: &str) -> Option<String> {
    let key = format!("\"{}\"", field);
    let pos = json.find(&key)?;
    let after = &json[pos + key.len()..];
    let colon = after.find(':')?;
    let value_start = after[colon + 1..].trim_start();
    if value_start.starts_with('"') {
        let end = value_start[1..].find('"')?;
        Some(value_start[1..=end].replace("\\\\", "\\").replace("\\/", "/"))
    } else {
        None
    }
}

// ─── get_mod_status ───────────────────────────────────────────────────────

#[tauri::command]
pub fn get_mod_status(game_path: String) -> ModStatus {
    if game_path.is_empty() {
        return ModStatus { installed: false, version: String::new(), backup_exists: false };
    }
    let marker = PathBuf::from(&game_path).join(".flmm_installed");
    let backup = PathBuf::from(&game_path).join("Runtime_backup_original");
    let installed = marker.exists();
    let version = if installed {
        fs::read_to_string(&marker).unwrap_or_default().trim().to_string()
    } else {
        String::new()
    };
    ModStatus { installed, version, backup_exists: backup.exists() }
}

#[tauri::command]
pub fn install_mod(game_path: String, mod_path: String, lang: String) -> Result<String, String> {
    let is_pt = lang == "pt";
    if game_path.is_empty() { 
        return Err(if is_pt { "Caminho do jogo não informado." } else { "Game path not provided." }.into()); 
    }
    if mod_path.is_empty()  { 
        return Err(if is_pt { "Caminho do mod não informado." } else { "Mod path not provided." }.into()); 
    }

    let game_dir   = PathBuf::from(&game_path);
    let runtime    = game_dir.join("Runtime");
    let backup     = game_dir.join("Runtime_backup_original");
    let mod_file   = PathBuf::from(&mod_path);

    if !mod_file.exists() {
        return Err(if is_pt { format!("Arquivo não encontrado: {}", mod_path) } else { format!("File not found: {}", mod_path) });
    }

    let ext = mod_file.extension().and_then(|e| e.to_str()).unwrap_or("");
    if ext != "rpkg" && ext != "zip" {
        return Err(if is_pt { "O arquivo deve ser .rpkg ou .zip" } else { "File must be .rpkg or .zip" }.into());
    }

    // Cria Runtime se não existir
    if !runtime.exists() {
        fs::create_dir_all(&runtime).map_err(|e| {
            if is_pt { format!("Erro ao criar pasta Runtime: {}", e) } else { format!("Error creating Runtime directory: {}", e) }
        })?;
    }

    // Backup (só se ainda não existe)
    if !backup.exists() {
        copy_dir_all(&runtime, &backup).map_err(|e| {
            if is_pt { format!("Erro no backup: {}", e) } else { format!("Error creating backup: {}", e) }
        })?;
    }

    if ext == "rpkg" {
        let dest = runtime.join(mod_file.file_name().unwrap());
        fs::copy(&mod_file, &dest).map_err(|e| {
            if is_pt { format!("Erro ao copiar RPKG: {}", e) } else { format!("Error copying RPKG: {}", e) }
        })?;
        update_package_definition(&runtime, mod_file.file_name().unwrap().to_str().unwrap())?;
    } else {
        extract_rpkg_from_zip(&mod_file, &runtime)?;
    }

    let version = "0.1.0";
    fs::write(game_dir.join(".flmm_installed"), version)
        .map_err(|e| {
            if is_pt { format!("Erro ao gravar versão: {}", e) } else { format!("Error writing version: {}", e) }
        })?;

    Ok(if is_pt { "Mod instalado com sucesso!" } else { "Mod installed successfully!" }.into())
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !src.exists() { return Ok(()); }
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let dst_path = dst.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_all(&entry.path(), &dst_path)?;
        } else {
            fs::copy(entry.path(), dst_path)?;
        }
    }
    Ok(())
}

fn update_package_definition(runtime: &Path, rpkg_name: &str) -> Result<(), String> {
    let pkg_def = runtime.join("packagedefinition.txt");
    let mut content = if pkg_def.exists() {
        fs::read_to_string(&pkg_def).map_err(|e| e.to_string())?
    } else {
        String::new()
    };

    let chunk = rpkg_name.trim_end_matches(".rpkg");
    let entry = format!("@include {}", chunk);
    if !content.contains(&entry) {
        if !content.is_empty() && !content.ends_with('\n') { content.push('\n'); }
        content.push_str(&entry);
        content.push('\n');
        fs::write(&pkg_def, &content).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn extract_rpkg_from_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    use std::io::Read;
    let file = fs::File::open(zip_path).map_err(|e| format!("Error opening ZIP: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid ZIP archive: {}", e))?;

    for i in 0..archive.len() {
        let mut zf = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = zf.name().to_string();
        if name.ends_with(".rpkg") {
            let fname = Path::new(&name).file_name().unwrap();
            let out = dest.join(fname);
            let mut buf = Vec::new();
            zf.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            fs::write(&out, &buf).map_err(|e| e.to_string())?;
            update_package_definition(dest, fname.to_str().unwrap())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn uninstall_mod(game_path: String, lang: String) -> Result<String, String> {
    let is_pt = lang == "pt";
    if game_path.is_empty() { 
        return Err(if is_pt { "Caminho do jogo não informado." } else { "Game path not provided." }.into()); 
    }

    let game_dir = PathBuf::from(&game_path);
    let runtime  = game_dir.join("Runtime");
    let backup   = game_dir.join("Runtime_backup_original");
    let marker   = game_dir.join(".flmm_installed");

    if !backup.exists() {
        return Err(if is_pt { "Backup não encontrado. Não é possível desinstalar com segurança." } else { "Backup not found. Cannot safely uninstall." }.into());
    }

    if runtime.exists() {
        fs::remove_dir_all(&runtime).map_err(|e| {
            if is_pt { format!("Erro ao remover pasta Runtime: {}", e) } else { format!("Error removing Runtime directory: {}", e) }
        })?;
    }

    copy_dir_all(&backup, &runtime).map_err(|e| {
        if is_pt { format!("Erro ao restaurar backup: {}", e) } else { format!("Error restoring backup: {}", e) }
    })?;
    fs::remove_dir_all(&backup).map_err(|e| {
        if is_pt { format!("Erro ao remover backup: {}", e) } else { format!("Error removing backup directory: {}", e) }
    })?;
    let _ = fs::remove_file(&marker);

    Ok(if is_pt { "Mods desinstalados! Arquivos originais restaurados." } else { "Mods uninstalled! Original game files restored." }.into())
}

// ─── check_updates ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn check_updates(current_version: String, mod_id: String) -> Result<NexusRelease, String> {
    if mod_id == "0" || mod_id.is_empty() {
        return Ok(NexusRelease {
            version: "0.1.0".into(),
            url: "https://www.nexusmods.com/007firstlight".into(),
            has_update: false,
        });
    }

    let url = format!("https://api.nexusmods.com/v1/games/007firstlight/mods/{}.json", mod_id);
    let client = reqwest::Client::new();

    let resp = client
        .get(&url)
        .header("User-Agent", "First-Light-Mod-Manager/0.1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Ok(NexusRelease {
            version: "0.1.0".into(),
            url: format!("https://www.nexusmods.com/007firstlight/mods/{}", mod_id),
            has_update: false,
        });
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let latest = json["version"].as_str().unwrap_or("0.1.0").to_string();
    let has_update = !current_version.is_empty() && latest != current_version;

    Ok(NexusRelease {
        version: latest,
        url: format!("https://www.nexusmods.com/007firstlight/mods/{}", mod_id),
        has_update,
    })
}

// ─── open_game_folder ────────────────────────────────────────────────────

#[tauri::command]
pub fn open_game_folder(game_path: String) -> Result<(), String> {
    if game_path.is_empty() { return Err("No game directory configured.".into()); }
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&game_path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}
