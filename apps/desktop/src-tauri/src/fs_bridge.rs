use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// One skill source file found inside an opened workspace.
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

/// What the UI gets back when it opens a single file outside any workspace.
#[derive(Serialize, Deserialize)]
pub struct StandaloneSkill {
    /// Absolute path to the file. The UI uses this as both the workspace
    /// root (so saves go alongside it) and the active path.
    pub path: String,
    pub content: String,
}

const SCAN_MAX_DEPTH: usize = 8;
const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "target",
    "out",
    ".turbo",
    ".cache",
];

fn is_ignored(name: &str) -> bool {
    IGNORED_DIRS.iter().any(|d| *d == name)
}

/// Is this filename almost certainly a crosskill skill file?
/// Strong-signal names land here without us reading the file.
fn is_strong_skill_name(name: &str) -> bool {
    name.ends_with(".skill.md") || name == "skill.md" || name == "SKILL.md"
}

/// Cheap, no-LLM heuristic: does the front-matter look like a crosskill
/// skill? We just need it to declare a `targets:` block, which no plain
/// Markdown doc does by accident. We don't fully parse YAML — that's the
/// core library's job at compile time.
fn looks_like_crosskill_frontmatter(content: &str) -> bool {
    let trimmed = content.trim_start_matches('\u{feff}');
    if !trimmed.starts_with("---") {
        return false;
    }
    // Pull the frontmatter region between the first `---` and the second.
    let after_open = &trimmed[3..];
    let close = match after_open.find("\n---") {
        Some(i) => i,
        None => return false,
    };
    let block = &after_open[..close];
    // `targets:` is the unambiguous marker. Anchor at start-of-line so a
    // body mention of the word doesn't false-positive (we only look in
    // the frontmatter region anyway, but be safe).
    block.lines().any(|l| {
        let t = l.trim_start();
        t.starts_with("targets:")
    })
}

/// Read a workspace folder: locate every crosskill skill file up to
/// `SCAN_MAX_DEPTH` levels deep, skipping noisy directories.
///
/// A "skill file" is anything named `*.skill.md` / `skill.md` / `SKILL.md`,
/// OR any `*.md` whose YAML frontmatter declares `targets:`. The second
/// rule means existing repos with skills under names like `code-review.md`
/// still show up without renaming.
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
        let strong = is_strong_skill_name(&name);
        // Only inspect .md files we don't already recognise by name; bail
        // on everything else fast.
        if !strong && !name.ends_with(".md") {
            continue;
        }

        let content = match fs::read_to_string(entry.path()) {
            Ok(c) => c,
            // Unreadable file (permissions, weird encoding) — skip, don't
            // poison the whole scan with an error.
            Err(_) => continue,
        };

        if !strong && !looks_like_crosskill_frontmatter(&content) {
            continue;
        }

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

/// Open a single skill file outside a workspace. Used by the drag-and-drop
/// handler and the "Open file…" menu item. Returns the absolute path back
/// so the React side can treat the file's parent dir as a workspace-of-one.
#[tauri::command]
pub fn open_single_file(path: String) -> Result<StandaloneSkill, String> {
    let p = PathBuf::from(&path);
    if !p.is_file() {
        return Err(format!("Not a file: {}", path));
    }
    let content = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    Ok(StandaloneSkill {
        path: p.to_string_lossy().to_string(),
        content,
    })
}

/// Read a single file's contents (used when the UI clicks a skill in the
/// sidebar that wasn't yet eagerly loaded).
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(Path::new(&path)).map_err(|e| e.to_string())
}

/// Create a new skill file under the open workspace. The UI provides the
/// name (used as filename + frontmatter `name`) and an optional starter
/// body. Returns the workspace-relative POSIX path the UI should now make
/// active.
#[tauri::command]
pub fn create_skill(root: String, name: String) -> Result<String, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }
    let safe_name = name.trim();
    if safe_name.is_empty() {
        return Err("Name cannot be empty.".to_string());
    }
    // Defensive: reject path separators and traversal — `name` is just the
    // skill name, not a path.
    if safe_name.contains('/')
        || safe_name.contains('\\')
        || safe_name.contains("..")
        || safe_name.starts_with('.')
    {
        return Err(format!(
            "Invalid skill name {:?}. Use lowercase letters, digits, hyphens.",
            safe_name
        ));
    }

    let rel = format!("crosskill/{}.skill.md", safe_name);
    let abs = root_path.join(&rel);
    if abs.exists() {
        return Err(format!("Skill already exists: {}", rel));
    }
    if let Some(parent) = abs.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let starter = format!(
        "---\n\
         name: {}\n\
         version: 0.1.0\n\
         description: Describe what this skill does in one sentence.\n\
         tags: []\n\
         targets:\n\
         \u{0020} claude: true\n\
         \u{0020} cursor: true\n\
         \u{0020} codex: true\n\
         \u{0020} windsurf: true\n\
         \u{0020} aider: true\n\
         \u{0020} opencode: true\n\
         \u{0020} gemini: true\n\
         ---\n\
         \n\
         Write the prompt body here. This is the actual instruction every\n\
         compiled target will see.\n\
         \n\
         ## Examples\n\
         \n\
         **Input:** ...\n\
         **Output:** ...\n",
        safe_name
    );
    fs::write(&abs, starter).map_err(|e| e.to_string())?;
    Ok(rel)
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
