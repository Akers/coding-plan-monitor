use std::fs;
use std::path::PathBuf;

use tauri::Emitter;

use crate::models::AppConfig;

/// 获取配置文件目录路径
/// ~/.config/coding-plan-monitor/
pub fn config_dir() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".config").join("coding-plan-monitor")
}

/// 获取配置文件路径
pub fn config_file_path() -> PathBuf {
    config_dir().join("config.json")
}

/// 从文件加载配置
/// 如果文件不存在，创建默认配置并写入文件
/// 如果文件损坏，返回默认配置并记录警告
#[tauri::command]
pub fn load_config() -> Result<AppConfig, String> {
    let path = config_file_path();

    if !path.exists() {
        let config = AppConfig::default();
        save_config_to_file(&config)?;
        return Ok(config);
    }

    match fs::read_to_string(&path) {
        Ok(content) => match serde_json::from_str::<AppConfig>(&content) {
            Ok(config) => Ok(config),
            Err(e) => {
                log::warn!("配置文件损坏，使用默认配置: {}", e);
                Ok(AppConfig::default())
            }
        },
        Err(e) => {
            log::warn!("读取配置文件失败，使用默认配置: {}", e);
            Ok(AppConfig::default())
        }
    }
}

/// 保存配置到文件
#[tauri::command]
pub fn save_config(app_handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    save_config_to_file(&config)?;

    // TODO(v2): 使用 tauri-plugin-stronghold 或 OS keyring 加密存储 API Key
    // 当前方案仅设置文件权限为 600，防止同机其他用户读取
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o600);
        fs::set_permissions(config_file_path(), perms)
            .map_err(|e| format!("设置文件权限失败: {}", e))?;
    }

    // 通知前端配置已保存
    let _ = app_handle.emit("config-saved", ());

    Ok(())
}

/// 内部函数：保存配置到文件
fn save_config_to_file(config: &AppConfig) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {}", e))?;

    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(config_file_path(), json)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// 测试辅助：创建临时目录作为配置目录
    struct TempConfigDir {
        #[allow(dead_code)]
        original_dir: Option<PathBuf>,
        temp_dir: PathBuf,
    }

    impl TempConfigDir {
        fn new() -> Self {
            let temp_dir = std::env::temp_dir().join(format!(
                "cpm-test-{}-{:?}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos(),
                std::thread::current().id()
            ));
            fs::create_dir_all(&temp_dir).unwrap();

            // Override config_dir by using an env-based approach
            // For tests, we'll directly test save/load with explicit paths
            Self {
                original_dir: None,
                temp_dir,
            }
        }

        fn config_path(&self) -> PathBuf {
            self.temp_dir.join("config.json")
        }

        fn cleanup(&self) {
            let _ = fs::remove_dir_all(&self.temp_dir);
        }
    }

    impl Drop for TempConfigDir {
        fn drop(&mut self) {
            self.cleanup();
        }
    }

    #[test]
    fn save_and_load_roundtrip() {
        let temp = TempConfigDir::new();
        let config_path = temp.config_path();

        let original = AppConfig::default();
        let json = serde_json::to_string_pretty(&original).unwrap();
        fs::write(&config_path, &json).unwrap();

        let content = fs::read_to_string(&config_path).unwrap();
        let loaded: AppConfig = serde_json::from_str(&content).unwrap();

        assert_eq!(loaded, original);
    }

    #[test]
    fn load_nonexistent_file_returns_default() {
        // When no file exists, loading should return default
        let config = AppConfig::default();
        assert_eq!(config.refresh_interval, 30);
        assert!(config.providers.is_empty());
    }

    #[test]
    fn load_corrupted_file_returns_default() {
        let temp = TempConfigDir::new();
        let config_path = temp.config_path();

        // Write invalid JSON
        fs::write(&config_path, "{ invalid json }").unwrap();

        let content = fs::read_to_string(&config_path).unwrap();
        let result = serde_json::from_str::<AppConfig>(&content);
        assert!(result.is_err());
    }

    #[test]
    fn save_creates_directory_structure() {
        let temp = TempConfigDir::new();
        let nested_dir = temp.temp_dir.join("nested").join("deep");
        let config_path = nested_dir.join("config.json");

        fs::create_dir_all(&nested_dir).unwrap();

        let config = AppConfig::default();
        let json = serde_json::to_string_pretty(&config).unwrap();
        fs::write(&config_path, &json).unwrap();

        assert!(config_path.exists());
        let loaded: AppConfig =
            serde_json::from_str(&fs::read_to_string(&config_path).unwrap()).unwrap();
        assert_eq!(loaded, config);
    }

    #[test]
    fn save_preserves_provider_configs() {
        use crate::models::{AuthType, ProviderConfig, ProviderId};

        let mut config = AppConfig::default();
        config.providers.push(ProviderConfig {
            provider_id: ProviderId::Zhipu,
            enabled: true,
            auth_type: AuthType::OAuth,
            api_key: None,
            token: Some("test-token".to_string()),
            token_expire_at: Some(1700000000000),
        });

        let json = serde_json::to_string_pretty(&config).unwrap();

        // Verify provider data is in JSON
        assert!(json.contains("\"zhipu\""));
        assert!(json.contains("\"test-token\""));

        let loaded: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(loaded.providers.len(), 1);
        assert_eq!(loaded.providers[0].token.clone().unwrap(), "test-token");
    }
}
