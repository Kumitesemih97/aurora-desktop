// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::process::{Command, Child};
use tokio::io::{AsyncWriteExt, AsyncBufReadExt, BufReader};
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::oneshot;

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse {
    id: serde_json::Value,
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
}

struct McpServer {
    _process: Child,
    stdin: tokio::process::ChildStdin,
}

struct ServerManagerInner {
    servers: Mutex<HashMap<String, McpServer>>,
    pending_requests: Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>,
}

#[derive(Clone)]
struct ServerManager(Arc<ServerManagerInner>);

impl Default for ServerManager {
    fn default() -> Self {
        Self(Arc::new(ServerManagerInner {
            servers: Mutex::new(HashMap::new()),
            pending_requests: Mutex::new(HashMap::new()),
        }))
    }
}

#[tauri::command]
async fn start_mcp_server(
    name: String,
    command: String,
    args: Vec<String>,
    state: State<'_, ServerManager>,
) -> Result<String, String> {
    let mut child = Command::new(command)
        .args(args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn MCP server: {}", e))?;

    let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;

    let manager = state.0.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(&line) {
                let id_str = response.id.to_string();
                let mut pending = manager.pending_requests.lock().unwrap();
                if let Some(tx) = pending.remove(&id_str) {
                    let result = serde_json::to_value(response).unwrap();
                    let _ = tx.send(result);
                }
            }
        }
    });

    let mut servers = state.0.servers.lock().unwrap();
    servers.insert(name.clone(), McpServer {
        _process: child,
        stdin,
    });

    Ok(format!("Server {} started", name))
}

#[tauri::command]
async fn stop_mcp_server(
    name: String,
    state: State<'_, ServerManager>,
) -> Result<String, String> {
    let mut servers = state.0.servers.lock().unwrap();
    if let Some(mut server) = servers.remove(&name) {
        server._process.kill().await.map_err(|e| e.to_string())?;
        Ok(format!("Server {} stopped", name))
    } else {
        Err("Server not found".to_string())
    }
}

#[tauri::command]
async fn send_mcp_request(
    name: String,
    request: serde_json::Value,
    state: State<'_, ServerManager>,
) -> Result<serde_json::Value, String> {
    let id = request.get("id").ok_or("Request missing id")?.to_string();
    let (tx, rx) = oneshot::channel();

    {
        let mut pending = state.0.pending_requests.lock().unwrap();
        pending.insert(id.clone(), tx);
    }

    let mut servers = state.0.servers.lock().unwrap();
    if let Some(server) = servers.get_mut(&name) {
        let req_str = serde_json::to_string(&request).map_err(|e| e.to_string())?;
        server.stdin.write_all(req_str.as_bytes()).await.map_err(|e| e.to_string())?;
        server.stdin.write_all(b"\n").await.map_err(|e| e.to_string())?;
        server.stdin.flush().await.map_err(|e| e.to_string())?;
    } else {
        let mut pending = state.0.pending_requests.lock().unwrap();
        pending.remove(&id);
        return Err("Server not found".to_string());
    }

    // Wait for the background reader to resolve the request
    match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
        Ok(Ok(response)) => Ok(response),
        Ok(Err(_)) => Err("Request cancelled".to_string()),
        Err(_) => Err("Request timed out".to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerManager::default())
        .invoke_handler(tauri::generate_handler![
            start_mcp_server,
            stop_mcp_server,
            send_mcp_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
