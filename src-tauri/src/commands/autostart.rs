use tauri::command;

#[command]
pub async fn set_auto_start(
    manager: tauri::State<'_, tauri_plugin_autostart::AutoLaunchManager>,
    enable: bool,
) -> Result<bool, String> {
    if enable {
        manager.enable().map_err(|e| e.to_string())?;
    } else {
        manager.disable().map_err(|e| e.to_string())?;
    }
    Ok(enable)
}

#[command]
pub async fn get_auto_start(
    manager: tauri::State<'_, tauri_plugin_autostart::AutoLaunchManager>,
) -> Result<bool, String> {
    manager.is_enabled().map_err(|e| e.to_string())
}
