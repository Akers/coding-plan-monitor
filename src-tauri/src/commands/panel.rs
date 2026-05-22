use tauri::Manager;

/// 设置面板窗口点击穿透
#[tauri::command]
pub fn set_click_through(
    app: tauri::AppHandle,
    enable: bool,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("panel") {
        // Windows 下使用 set_ignore_cursor_events
        window
            .set_ignore_cursor_events(enable)
            .map_err(|e| format!("设置点击穿透失败: {}", e))?;
    }
    Ok(())
}

/// 设置面板置顶
#[tauri::command]
pub fn set_panel_always_on_top(
    app: tauri::AppHandle,
    always_on_top: bool,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("panel") {
        window
            .set_always_on_top(always_on_top)
            .map_err(|e| format!("设置置顶失败: {}", e))?;
    }
    Ok(())
}

/// 设置面板位置
#[tauri::command]
pub fn set_panel_position(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("panel") {
        window
            .set_position(tauri::Position::Logical(tauri::LogicalPosition::new(
                x, y,
            )))
            .map_err(|e| format!("设置面板位置失败: {}", e))?;
    }
    Ok(())
}

/// 设置面板大小
#[tauri::command]
pub fn set_panel_size(
    app: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("panel") {
        window
            .set_size(tauri::Size::Logical(tauri::LogicalSize::new(width, height)))
            .map_err(|e| format!("设置面板大小失败: {}", e))?;
    }
    Ok(())
}

/// 获取面板位置
#[tauri::command]
pub fn get_panel_position(app: tauri::AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("panel") {
        let pos = window
            .outer_position()
            .map_err(|e| format!("获取面板位置失败: {}", e))?;
        Ok((pos.x as f64, pos.y as f64))
    } else {
        Err("面板窗口不存在".to_string())
    }
}

/// 获取屏幕尺寸（用于吸附计算）
#[tauri::command]
pub fn get_screen_size(app: tauri::AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("panel") {
        if let Some(monitor) = window.primary_monitor().map_err(|e| format!("获取显示器失败: {}", e))? {
            let size = monitor.size();
            Ok((size.width as f64, size.height as f64))
        } else {
            // 回退：使用当前窗口所在显示器
            if let Some(monitor) = window.current_monitor().map_err(|e| format!("获取当前显示器失败: {}", e))? {
                let size = monitor.size();
                Ok((size.width as f64, size.height as f64))
            } else {
                Err("无法获取显示器信息".to_string())
            }
        }
    } else {
        Err("面板窗口不存在".to_string())
    }
}

/// 面板吸附到屏幕边缘
/// 吸附阈值默认 20px
#[tauri::command]
pub fn snap_panel_to_edge(
    app: tauri::AppHandle,
    panel_width: f64,
    panel_height: f64,
    threshold: Option<f64>,
) -> Result<(f64, f64), String> {
    let snap_threshold = threshold.unwrap_or(20.0);
    
    if let Some(window) = app.get_webview_window("panel") {
        let pos = window
            .outer_position()
            .map_err(|e| format!("获取面板位置失败: {}", e))?;

        let x = pos.x as f64;
        let y = pos.y as f64;

        // 获取屏幕尺寸
        let screen = if let Some(monitor) = window.current_monitor().map_err(|e| format!("获取显示器失败: {}", e))? {
            let size = monitor.size();
            let scale = monitor.scale_factor();
            (size.width as f64 / scale, size.height as f64 / scale)
        } else {
            (1920.0, 1080.0) // 默认回退
        };

        let (screen_w, screen_h) = screen;
        let mut new_x = x;
        let mut new_y = y;

        // 左边吸附
        if x < snap_threshold {
            new_x = 0.0;
        }
        // 右边吸附
        if x + panel_width > screen_w - snap_threshold {
            new_x = screen_w - panel_width;
        }
        // 顶部吸附
        if y < snap_threshold {
            new_y = 0.0;
        }
        // 底部吸附
        if y + panel_height > screen_h - snap_threshold {
            new_y = screen_h - panel_height;
        }

        // 如果位置有变化，移动窗口
        if (new_x - x).abs() > 0.1 || (new_y - y).abs() > 0.1 {
            window
                .set_position(tauri::Position::Logical(tauri::LogicalPosition::new(
                    new_x, new_y,
                )))
                .map_err(|e| format!("吸附移动失败: {}", e))?;
        }

        Ok((new_x, new_y))
    } else {
        Err("面板窗口不存在".to_string())
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn snap_threshold_default() {
        let threshold = None;
        let snap_threshold = threshold.unwrap_or(20.0);
        assert_eq!(snap_threshold, 20.0);
    }

    #[test]
    fn snap_threshold_custom() {
        let threshold = Some(30.0);
        let snap_threshold = threshold.unwrap_or(20.0);
        assert_eq!(snap_threshold, 30.0);
    }

    #[test]
    fn snap_logic_left_edge() {
        let x = 10.0;
        let snap_threshold = 20.0;
        let new_x = if x < snap_threshold { 0.0 } else { x };
        assert_eq!(new_x, 0.0);
    }

    #[test]
    fn snap_logic_right_edge() {
        let x = 1870.0;
        let panel_width = 60.0;
        let screen_w = 1920.0;
        let snap_threshold = 20.0;
        let new_x = if x + panel_width > screen_w - snap_threshold {
            screen_w - panel_width
        } else {
            x
        };
        assert_eq!(new_x, 1860.0);
    }

    #[test]
    fn snap_logic_top_edge() {
        let y = 5.0;
        let snap_threshold = 20.0;
        let new_y = if y < snap_threshold { 0.0 } else { y };
        assert_eq!(new_y, 0.0);
    }

    #[test]
    fn snap_logic_bottom_edge() {
        let y = 1040.0;
        let panel_height = 60.0;
        let screen_h = 1080.0;
        let snap_threshold = 20.0;
        let new_y = if y + panel_height > screen_h - snap_threshold {
            screen_h - panel_height
        } else {
            y
        };
        assert_eq!(new_y, 1020.0);
    }

    #[test]
    fn snap_no_change_when_far_from_edge() {
        let x = 500.0;
        let snap_threshold = 20.0;
        let new_x = if x < snap_threshold { 0.0 } else { x };
        assert_eq!(new_x, 500.0);
    }

    #[test]
    fn position_changed_detection() {
        let (old_x, old_y): (f64, f64) = (100.0, 200.0);
        let (new_x, new_y): (f64, f64) = (0.0, 200.0);
        let changed = (new_x - old_x).abs() > 0.1 || (new_y - old_y).abs() > 0.1;
        assert!(changed);
    }

    #[test]
    fn position_not_changed_detection() {
        let (old_x, old_y): (f64, f64) = (100.0, 200.0);
        let (new_x, new_y): (f64, f64) = (100.0, 200.0);
        let changed = (new_x - old_x).abs() > 0.1 || (new_y - old_y).abs() > 0.1;
        assert!(!changed);
    }
}
