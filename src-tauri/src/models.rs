use serde::{Deserialize, Serialize};

// ============================================================
// ProviderId - 供应商标识符
// ============================================================

/// 供应商 ID
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderId {
    Zhipu,
    Minimax,
    Volcengine,
}

// ============================================================
// AuthType - 鉴权方式
// ============================================================

/// 鉴权方式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AuthType {
    #[serde(rename = "apikey")]
    ApiKey,
    OAuth,
}

// ============================================================
// ProviderConfig - 供应商配置
// ============================================================

/// 供应商配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    /// 供应商 ID
    pub provider_id: ProviderId,
    /// 是否启用
    pub enabled: bool,
    /// 鉴权方式
    pub auth_type: AuthType,
    /// API Key（authType 为 apikey 时使用）
    pub api_key: Option<String>,
    /// OAuth Token（authType 为 oauth 时使用）
    pub token: Option<String>,
    /// OAuth Token 过期时间（Unix 时间戳毫秒）
    pub token_expire_at: Option<u64>,
}

// ============================================================
// PanelEdge - 面板吸附边
// ============================================================

/// 面板吸附边
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PanelEdge {
    Top,
    Bottom,
    Left,
    Right,
}

// ============================================================
// AppConfig - 应用配置
// ============================================================

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    /// 数据刷新间隔（秒）
    pub refresh_interval: u32,
    /// 供应商轮播间隔（秒）
    pub carousel_interval: u32,
    /// 面板背景色（十六进制）
    pub panel_bg_color: String,
    /// 面板透明度 (0-1)
    pub panel_opacity: f64,
    /// 面板吸附边
    pub panel_edge: PanelEdge,
    /// 面板是否锁定位置
    pub panel_locked: bool,
    /// 是否启用点击穿透
    pub click_through: bool,
    /// 一级阈值百分比（绿色→黄色）
    pub threshold1: u32,
    /// 二级阈值百分比（黄色→红色）
    pub threshold2: u32,
    /// 一级阈值颜色（低于 threshold1）
    pub threshold_color1: String,
    /// 二级阈值颜色（threshold1 ~ threshold2）
    pub threshold_color2: String,
    /// 三级阈值颜色（高于 threshold2）
    pub threshold_color3: String,
    /// 是否启用限额提醒
    pub alert_enabled: bool,
    /// 限额提醒阈值百分比
    pub alert_threshold: u32,
    /// 是否开机自启动
    pub auto_start: bool,
    /// OAuth 回调端口，默认 9527
    #[serde(default = "default_oauth_port")]
    pub oauth_port: u16,
    /// 供应商配置列表
    pub providers: Vec<ProviderConfig>,
}

fn default_oauth_port() -> u16 { 9527 }

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            refresh_interval: 30,
            carousel_interval: 10,
            panel_bg_color: "#333333".to_string(),
            panel_opacity: 0.8,
            panel_edge: PanelEdge::Top,
            panel_locked: false,
            click_through: false,
            threshold1: 50,
            threshold2: 80,
            threshold_color1: "#4caf50".to_string(),
            threshold_color2: "#ff9800".to_string(),
            threshold_color3: "#f44336".to_string(),
            alert_enabled: true,
            alert_threshold: 80,
            auto_start: false,
            oauth_port: 9527,
            providers: vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_correct_values() {
        let config = AppConfig::default();
        assert_eq!(config.refresh_interval, 30);
        assert_eq!(config.carousel_interval, 10);
        assert_eq!(config.panel_bg_color, "#333333");
        assert!((config.panel_opacity - 0.8).abs() < f64::EPSILON);
        assert_eq!(config.panel_edge, PanelEdge::Top);
        assert!(!config.panel_locked);
        assert!(!config.click_through);
        assert_eq!(config.threshold1, 50);
        assert_eq!(config.threshold2, 80);
        assert_eq!(config.threshold_color1, "#4caf50");
        assert_eq!(config.threshold_color2, "#ff9800");
        assert_eq!(config.threshold_color3, "#f44336");
        assert!(config.alert_enabled);
        assert_eq!(config.alert_threshold, 80);
        assert!(!config.auto_start);
        assert!(config.providers.is_empty());
    }

    #[test]
    fn app_config_serialization_roundtrip() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, config);
    }

    #[test]
    fn provider_config_serialization_roundtrip() {
        let provider = ProviderConfig {
            provider_id: ProviderId::Minimax,
            enabled: true,
            auth_type: AuthType::ApiKey,
            api_key: Some("sk-test-key".to_string()),
            token: None,
            token_expire_at: None,
        };

        let json = serde_json::to_string(&provider).unwrap();
        let parsed: ProviderConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, provider);
    }

    #[test]
    fn oauth_provider_config_serialization() {
        let provider = ProviderConfig {
            provider_id: ProviderId::Zhipu,
            enabled: true,
            auth_type: AuthType::OAuth,
            api_key: None,
            token: Some("oauth-token-xxx".to_string()),
            token_expire_at: Some(1700000000000),
        };

        let json = serde_json::to_string(&provider).unwrap();
        let parsed: ProviderConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.provider_id, ProviderId::Zhipu);
        assert_eq!(parsed.token.unwrap(), "oauth-token-xxx");
        assert_eq!(parsed.token_expire_at.unwrap(), 1700000000000);
    }

    #[test]
    fn config_with_providers_roundtrip() {
        let mut config = AppConfig::default();
        config.providers.push(ProviderConfig {
            provider_id: ProviderId::Volcengine,
            enabled: false,
            auth_type: AuthType::OAuth,
            api_key: None,
            token: None,
            token_expire_at: None,
        });

        let json = serde_json::to_string_pretty(&config).unwrap();
        let parsed: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.providers.len(), 1);
        assert_eq!(parsed.providers[0].provider_id, ProviderId::Volcengine);
        assert!(!parsed.providers[0].enabled);
    }

    #[test]
    fn provider_id_serializes_to_lowercase() {
        let id = ProviderId::Zhipu;
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, "\"zhipu\"");
    }

    #[test]
    fn auth_type_serializes_correctly() {
        let apikey = serde_json::to_string(&AuthType::ApiKey).unwrap();
        assert_eq!(apikey, "\"apikey\"");

        let oauth = serde_json::to_string(&AuthType::OAuth).unwrap();
        assert_eq!(oauth, "\"oauth\"");
    }

    #[test]
    fn field_names_are_camel_case() {
        let provider = ProviderConfig {
            provider_id: ProviderId::Zhipu,
            enabled: true,
            auth_type: AuthType::ApiKey,
            api_key: Some("key".to_string()),
            token: None,
            token_expire_at: None,
        };

        let json = serde_json::to_string(&provider).unwrap();
        assert!(json.contains("\"providerId\""));
        assert!(json.contains("\"authType\""));
        assert!(json.contains("\"apiKey\""));
        assert!(json.contains("\"tokenExpireAt\""));
    }

    #[test]
    fn config_field_names_are_camel_case() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"refreshInterval\""));
        assert!(json.contains("\"carouselInterval\""));
        assert!(json.contains("\"panelBgColor\""));
        assert!(json.contains("\"panelOpacity\""));
        assert!(json.contains("\"panelEdge\""));
        assert!(json.contains("\"panelLocked\""));
        assert!(json.contains("\"clickThrough\""));
        assert!(json.contains("\"thresholdColor1\""));
        assert!(json.contains("\"alertEnabled\""));
        assert!(json.contains("\"alertThreshold\""));
        assert!(json.contains("\"autoStart\""));
    }

    #[test]
    fn cross_language_json_compatibility() {
        // Simulate JSON produced by TS side
        let ts_json = r#"{
            "providerId": "minimax",
            "enabled": true,
            "authType": "apikey",
            "apiKey": "sk-xxx"
        }"#;

        let provider: ProviderConfig = serde_json::from_str(ts_json).unwrap();
        assert_eq!(provider.provider_id, ProviderId::Minimax);
        assert_eq!(provider.auth_type, AuthType::ApiKey);
        assert_eq!(provider.api_key.unwrap(), "sk-xxx");
    }
}
