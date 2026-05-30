mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::detect_game,
            commands::get_mod_status,
            commands::install_mod,
            commands::uninstall_mod,
            commands::check_updates,
            commands::open_game_folder
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar First Light Mod Manager");
}
