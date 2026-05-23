mod fs_bridge;
mod watcher;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            fs_bridge::open_workspace,
            fs_bridge::write_outputs,
            fs_bridge::read_file,
            watcher::start_watching,
            watcher::stop_watching,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::tray::TrayIconBuilder;
                let _tray = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("crosskill")
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
