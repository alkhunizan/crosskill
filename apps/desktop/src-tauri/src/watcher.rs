use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

static WATCHER_STATE: Mutex<Option<RecommendedWatcher>> = Mutex::new(None);

/// Begin watching `root` recursively. Each `.skill.md` change emits a
/// `skill-changed` event with the affected paths so the UI can reload.
#[tauri::command]
pub fn start_watching(app: AppHandle, root: String) -> Result<(), String> {
    let (tx, rx) = channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default()).map_err(|e| e.to_string())?;
    watcher
        .watch(Path::new(&root), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        for event in rx {
            if let Ok(event) = event {
                let paths: Vec<String> = event
                    .paths
                    .iter()
                    .filter(|p| {
                        p.to_string_lossy().ends_with(".skill.md")
                            || p.file_name()
                                .map(|n| n == "skill.md")
                                .unwrap_or(false)
                    })
                    .map(|p| p.to_string_lossy().to_string())
                    .collect();
                if !paths.is_empty() {
                    let _ = app.emit("skill-changed", paths);
                }
            }
        }
    });

    if let Ok(mut guard) = WATCHER_STATE.lock() {
        *guard = Some(watcher);
    }
    Ok(())
}

#[tauri::command]
pub fn stop_watching() -> Result<(), String> {
    if let Ok(mut guard) = WATCHER_STATE.lock() {
        *guard = None;
    }
    Ok(())
}
