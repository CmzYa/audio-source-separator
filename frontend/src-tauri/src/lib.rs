use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

// 全局存储后端进程
static BACKEND_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

/// 启动 Python 后端
fn start_backend(app_handle: &tauri::AppHandle) -> Result<Child, Box<dyn std::error::Error>> {
    // 获取后端可执行文件路径
    let backend_path = if cfg!(debug_assertions) {
        // 开发模式：使用项目目录中的后端
        let project_root = std::env::current_dir()?
            .parent()
            .and_then(|p| p.parent())
            .unwrap();
        project_root.join("backend").join("main.py")
    } else {
        // 生产模式：使用打包后的后端可执行文件
        // Tauri externalBin 会将文件放在应用目录
        let resource_dir = app_handle.path().resource_dir()?;
        resource_dir.join("audio-separator-backend.exe")
    };

    log::info!("Backend path: {}", backend_path.display());

    // 启动后端
    let child = if cfg!(debug_assertions) {
        // 开发模式：使用 python 运行
        Command::new("python")
            .arg(&backend_path)
            .spawn()?
    } else {
        // 生产模式：直接运行打包后的 exe
        Command::new(&backend_path)
            .spawn()?
    };

    Ok(child)
}

/// 停止 Python 后端
fn stop_backend() {
    let mut process = BACKEND_PROCESS.lock().unwrap();
    if let Some(mut child) = process.take() {
        let _ = child.kill();
        log::info!("Backend stopped");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 初始化日志插件
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            // 启动后端
            match start_backend(&app.handle()) {
                Ok(child) => {
                    let mut process = BACKEND_PROCESS.lock().unwrap();
                    *process = Some(child);
                    log::info!("Backend started successfully");
                }
                Err(e) => {
                    log::error!("Failed to start backend: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 窗口关闭时停止后端
                stop_backend();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}