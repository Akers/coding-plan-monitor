pub mod models;
pub mod commands;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindowBuilder, WebviewUrl,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            // 创建系统托盘
            let show_panel = MenuItemBuilder::with_id("show_panel", "显示面板").build(app)?;
            let open_config = MenuItemBuilder::with_id("open_config", "配置").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show_panel, &open_config, &quit])
                .build()?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("Coding Plan Monitor")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show_panel" => {
                        if let Some(window) = app.get_webview_window("panel") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "open_config" => {
                        if let Some(window) = app.get_webview_window("config") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            let _window = WebviewWindowBuilder::new(
                                app,
                                "config",
                                WebviewUrl::App("/config".into()),
                            )
                            .title("配置 - Coding Plan Monitor")
                            .inner_size(500.0, 600.0)
                            .center()
                            .build()
                            .unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("panel") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::config::load_config,
            commands::config::save_config,
            commands::tray::toggle_panel,
            commands::tray::open_config_window,
            commands::tray::update_tray_status,
            commands::panel::set_click_through,
            commands::panel::set_panel_always_on_top,
            commands::panel::set_panel_position,
            commands::panel::set_panel_size,
            commands::panel::get_panel_position,
            commands::panel::get_screen_size,
            commands::panel::snap_panel_to_edge,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
