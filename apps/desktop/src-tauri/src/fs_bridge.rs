use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// One `*.skill.md` source file found inside an opened workspace.
#[derive(Serialize, Deserialize)]
pub struct SkillFile {
    /// Path relative to the workspace root, POSIX-separated.
    pub path: String,
    pub content: String,
}

/// The state we hand back to the React side after `open_workspace`.
#[derive(Serialize, Deserialize)]
pub struct Workspace {
    pub root: String,
    pub skills: Vec<SkillFile>,
}

/// One compiled output the UI wants persisted under the workspace root.
#[derive(Serialize, Deserialize)]
pub struct WriteOutput {
    /// Workspace-relative POSIX path, e.g. `.claude/skills/foo/SKILL.md`.
    pub path: String,
    pub content: String,
}

const SCAN_MAX_DEPTH: usize = 6;
const IGNORED_DIRS: &[&str] = &["node_modules", ".git", "dist", "build", ".next", "target", "out"];

fn is_ignored(name: &str) -> bool {
    IGNORED_DIRS.iter().any(|d| *d == name)
}

fn is_skill_file(name: &str) -> bool {
    name.ends_with(".skill.md") || name == "skill.md"
}

/// Read a workspace folder: locate every `*.skill.md` / bare `skill.md` file
/// up to `SCAN_MAX_DEPTH` levels deep, skipping noisy directories.
///
/// Returns sorted entries so the UI's sidebar order is deterministic.
#[tauri::command]
pub fn open_workspace(root: String) -> Result<Workspace, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }

    let mut skills: Vec<SkillFile> = Vec::new();

    for entry in WalkDir::new(&root_path)
        .max_depth(SCAN_MAX_DEPTH)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !(e.file_type().is_dir() && is_ignored(&name))
        })
    {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        if !entry.file_type().is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy();
        if !is_skill_file(&name) {
            continue;
        }

        let content = match fs::read_to_string(entry.path()) {
            Ok(c) => c,
            Err(err) => return Err(format!("Failed to read {}: {}", entry.path().display(), err)),
        };
        let rel = entry
            .path()
            .strip_prefix(&root_path)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");
        skills.push(SkillFile { path: rel, content });
    }

    skills.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(Workspace { root, skills })
}

/// Read a single file's contents (used when the UI clicks a skill in the
/// sidebar that wasn't yet eagerly loaded).
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(Path::new(&path)).map_err(|e| e.to_string())
}

/// Persist a batch of compiled outputs under the workspace root.
///
/// Every `WriteOutput.path` must resolve inside `root` after canonicalisation —
/// callers can't escape the workspace via `..` segments or absolute paths.
/// Returns the number of files written so the UI can show a "Saved N file(s)"
/// status line.
#[tauri::command]
pub fn write_outputs(root: String, outputs: Vec<WriteOutput>) -> Result<usize, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }
    // Canonicalise the root once so the comparison below is stable.
    let canonical_root = match root_path.canonicalize() {
        Ok(p) => p,
        Err(err) => return Err(format!("Cannot canonicalise root {}: {}", root, err)),
    };

    let mut written = 0usize;
    for o in outputs {
        // Reject absolute or parent-traversing paths up front so the user's
        // workspace is never written outside of.
        if o.path.contains("..") || Path::new(&o.path).is_absolute() {
            return Err(format!("Refused to write outside workspace: {}", o.path));
        }
        let abs = root_path.join(&o.path);
        if let Some(parent) = abs.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        // Second defence: the canonical version of the target's parent must
        // still sit inside the canonical root. If canonicalise fails (the file
        // doesn't exist yet) we fall back to checking the joined path's prefix.
        let safe = match abs.parent().and_then(|p| p.canonicalize().ok()) {
            Some(parent_canonical) => parent_canonical.starts_with(&canonical_root),
            None => abs.starts_with(&root_path),
        };
        if !safe {
            return Err(format!("Refused to write outside workspace: {}", o.path));
        }
        fs::write(&abs, &o.content).map_err(|e| e.to_string())?;
        written += 1;
    }
    Ok(written)
}
