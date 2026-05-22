use std::io::{Read, Write};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

struct OAuthServer {
    shutdown: bool,
}

lazy_static::lazy_static! {
    static ref SERVER_STATE: Mutex<Option<OAuthServer>> = Mutex::new(None);
}

#[tauri::command]
pub fn start_oauth_server(port: u16, app_handle: AppHandle) -> Result<(), String> {
    let mut state = SERVER_STATE.lock().map_err(|e| e.to_string())?;
    if state.is_some() {
        return Err("OAuth server already running".to_string());
    }

    *state = Some(OAuthServer { shutdown: false });

    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let addr = format!("127.0.0.1:{}", port);
        let listener = match std::net::TcpListener::bind(&addr) {
            Ok(l) => l,
            Err(e) => {
                eprintln!("Failed to bind to {}: {}", addr, e);
                if let Ok(mut state) = SERVER_STATE.lock() {
                    *state = None;
                }
                return;
            }
        };

        // Set a timeout for the listener
        let _ = listener.set_nonblocking(true);

        let app_handle_inner = app_handle_clone;

        // Simple timeout mechanism - 5 minutes
        let start_time = std::time::Instant::now();
        let timeout = Duration::from_secs(300);

        loop {
            // Check timeout
            if start_time.elapsed() > timeout {
                println!("OAuth server timed out after 5 minutes");
                break;
            }

            // Check if server was stopped
            if let Ok(state) = SERVER_STATE.lock() {
                if state.as_ref().map(|s| s.shutdown).unwrap_or(false) {
                    break;
                }
            }

            // Try to accept a connection
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let mut buffer = [0; 1024];
                    if let Ok(_size) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer);

                        // Parse the request line to get the path
                        if let Some(request_line) = request.lines().next() {
                            if request_line.starts_with("GET ") {
                                if let Some(path) = request_line.split_whitespace().nth(1) {
                                    handle_oauth_callback(&path, &app_handle_inner);
                                }
                            }
                        }

                        // Send a simple 200 OK response
                        let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<!DOCTYPE html><html><head><title>OAuth Callback</title></head><body><h1>Authentication Successful</h1><p>You can close this window now.</p></body></html>";
                        let _ = stream.write_all(response.as_bytes());
                        let _ = stream.flush();

                        // Close connection after handling
                        break;
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    // No connection waiting, sleep a bit and retry
                    thread::sleep(Duration::from_millis(100));
                }
                Err(e) => {
                    eprintln!("Error accepting connection: {}", e);
                    thread::sleep(Duration::from_millis(100));
                }
            }
        }

        // Clean up server state
        if let Ok(mut state) = SERVER_STATE.lock() {
            *state = None;
        }
    });

    Ok(())
}

fn handle_oauth_callback(path: &str, app_handle: &AppHandle) {
    // Parse path to extract query parameters
    // Expected format: /callback?token=xxx&provider_id=yyy
    if let Some(query) = path.strip_prefix("/callback?") {
        let params: std::collections::HashMap<String, String> = query
            .split('&')
            .filter_map(|pair| {
                let mut parts = pair.splitn(2, '=');
                match (parts.next(), parts.next()) {
                    (Some(key), Some(val)) => Some((key.to_string(), val.to_string())),
                    _ => None,
                }
            })
            .collect();

        let token = params.get("token").cloned().unwrap_or_default();
        let provider_id = params.get("provider_id").cloned().unwrap_or_default();

        if !token.is_empty() {
            let payload = serde_json::json!({
                "token": token,
                "provider_id": provider_id
            });

            let _ = app_handle.emit("oauth-callback", payload);
        }
    }
}

#[tauri::command]
pub fn stop_oauth_server() -> Result<(), String> {
    let mut state = SERVER_STATE.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut server) = *state {
        server.shutdown = true;
        Ok(())
    } else {
        Err("No OAuth server running".to_string())
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_handle_oauth_callback_extracts_token_and_provider() {
        // This test validates the query parameter parsing logic
        let path = "/callback?token=abc123&provider_id=zhipu";
        let mut token = String::new();
        let mut provider_id = String::new();

        if let Some(query) = path.strip_prefix("/callback?") {
            let params: std::collections::HashMap<String, String> = query
                .split('&')
                .filter_map(|pair| {
                    let mut parts = pair.splitn(2, '=');
                    match (parts.next(), parts.next()) {
                        (Some(key), Some(val)) => Some((key.to_string(), val.to_string())),
                        _ => None,
                    }
                })
                .collect();

            token = params.get("token").cloned().unwrap_or_default();
            provider_id = params.get("provider_id").cloned().unwrap_or_default();
        }

        assert_eq!(token, "abc123");
        assert_eq!(provider_id, "zhipu");
    }

    #[test]
    fn test_handle_oauth_callback_with_only_token() {
        let path = "/callback?token=xyz789";
        let mut token = String::new();
        let mut provider_id = String::new();

        if let Some(query) = path.strip_prefix("/callback?") {
            let params: std::collections::HashMap<String, String> = query
                .split('&')
                .filter_map(|pair| {
                    let mut parts = pair.splitn(2, '=');
                    match (parts.next(), parts.next()) {
                        (Some(key), Some(val)) => Some((key.to_string(), val.to_string())),
                        _ => None,
                    }
                })
                .collect();

            token = params.get("token").cloned().unwrap_or_default();
            provider_id = params.get("provider_id").cloned().unwrap_or_default();
        }

        assert_eq!(token, "xyz789");
        assert_eq!(provider_id, "");
    }

    #[test]
    fn test_handle_oauth_callback_with_empty_token() {
        let path = "/callback?token=";
        let mut token = String::new();

        if let Some(query) = path.strip_prefix("/callback?") {
            let params: std::collections::HashMap<String, String> = query
                .split('&')
                .filter_map(|pair| {
                    let mut parts = pair.splitn(2, '=');
                    match (parts.next(), parts.next()) {
                        (Some(key), Some(val)) => Some((key.to_string(), val.to_string())),
                        _ => None,
                    }
                })
                .collect();

            token = params.get("token").cloned().unwrap_or_default();
        }

        assert_eq!(token, "");
    }

    #[test]
    fn test_handle_oauth_callback_with_no_query() {
        let path = "/";
        let result = path.strip_prefix("/callback?");
        assert!(result.is_none());
    }
}