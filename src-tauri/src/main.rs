// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, oneshot};
use tokio::process::{Command, Child};
use tokio::io::{AsyncWriteExt, AsyncBufReadExt, BufReader};
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, Emitter, Runtime};
use futures_util::StreamExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
enum ServerStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse {
    id: serde_json::Value,
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
}

enum McpTransport {
    Stdio {
        _process: Child,
        stdin: tokio::process::ChildStdin,
    },
    Sse {
        url: String,
        client: reqwest::Client,
    },
}

struct McpServer {
    transport: McpTransport,
    status: ServerStatus,
}

struct ServerManagerInner {
    servers: Mutex<HashMap<String, McpServer>>,
    statuses: Mutex<HashMap<String, ServerStatus>>,
    pending_requests: Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>,
    http_client: reqwest::Client,
}

#[derive(Clone)]
struct ServerManager(Arc<ServerManagerInner>);

impl Default for ServerManager {
    fn default() -> Self {
        Self(Arc::new(ServerManagerInner {
            servers: Mutex::new(HashMap::new()),
            statuses: Mutex::new(HashMap::new()),
            pending_requests: Mutex::new(HashMap::new()),
            http_client: reqwest::Client::new(),
        }))
    }
}

async fn update_status<R: Runtime>(app: &tauri::AppHandle<R>, name: String, status: ServerStatus) {
    let manager = app.state::<ServerManager>();
    let mut statuses = manager.0.statuses.lock().await;
    statuses.insert(name.clone(), status.clone());

    let _ = app.emit("mcp-status-changed", (name, status));
}

#[tauri::command]
async fn get_mcp_servers_status(state: State<'_, ServerManager>) -> Result<HashMap<String, ServerStatus>, String> {
    let statuses = state.0.statuses.lock().await;
    Ok(statuses.clone())
}

#[tauri::command]
async fn start_mcp_server<R: Runtime>(
    app: tauri::AppHandle<R>,
    name: String,
    command: String,
    args: Vec<String>,
    state: State<'_, ServerManager>,
) -> Result<String, String> {
    let manager = state.0.clone();

    // Check if it's an SSE URL
    if command.starts_with("http://") || command.starts_with("https://") {
        update_status(&app, name.clone(), ServerStatus::Connecting).await;

        let url = command.clone();
        let manager_clone = manager.clone();
        let app_clone = app.clone();
        let server_name = name.clone();

        tokio::spawn(async move {
            let client = &manager_clone.http_client;
            let res = client.get(&url).send().await;

            match res {
                Ok(mut response) => {
                    update_status(&app_clone, server_name.clone(), ServerStatus::Connected).await;

                    let mut stream = response.bytes_stream();
                    while let Some(item) = stream.next().await {
                        if let Ok(bytes) = item {
                            if let Ok(line) = String::from_utf8(bytes.to_vec()) {
                                for l in line.lines() {
                                    if l.starts_with("data: ") {
                                        let data = &l[6..];
                                        if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(data) {
                                            let id_str = response.id.to_string();
                                            let mut pending = manager_clone.pending_requests.lock().await;
                                            if let Some(tx) = pending.remove(&id_str) {
                                                let result = serde_json::to_value(response).unwrap();
                                                let _ = tx.send(result);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    update_status(&app_clone, server_name, ServerStatus::Disconnected).await;
                }
                Err(e) => {
                    update_status(&app_clone, server_name, ServerStatus::Error(e.to_string())).await;
                }
            }
        });

        let mut servers = manager.servers.lock().await;
        servers.insert(name.clone(), McpServer {
            transport: McpTransport::Sse {
                url: command,
                client: manager.http_client.clone(),
            },
            status: ServerStatus::Connecting,
        });

        Ok(format!("SSE Server {} starting", name))
    } else {
        // Local Stdio Server
        update_status(&app, name.clone(), ServerStatus::Connecting).await;

        let mut child = Command::new(&command)
            .args(&args)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| {
                let err_msg = format!("Failed to spawn MCP server: {}", e);
                let err_msg_clone = err_msg.clone();
                let app_c = app.clone();
                let name_c = name.clone();
                tokio::spawn(async move {
                    update_status(&app_c, name_c, ServerStatus::Error(err_msg_clone)).await;
                });
                err_msg
            })?;

        let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
        let stdout = child.stdout.take().ok_or("Failed to open stdout")?;

        let manager_clone = manager.clone();
        let app_clone = app.clone();
        let server_name = name.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(&line) {
                    let id_str = response.id.to_string();
                    let mut pending = manager_clone.pending_requests.lock().await;
                    if let Some(tx) = pending.remove(&id_str) {
                        let result = serde_json::to_value(response).unwrap();
                        let _ = tx.send(result);
                    }
                }
            }
            update_status(&app_clone, server_name, ServerStatus::Disconnected).await;
        });

        update_status(&app, name.clone(), ServerStatus::Connected).await;

        let mut servers = manager.servers.lock().await;
        servers.insert(name.clone(), McpServer {
            transport: McpTransport::Stdio {
                _process: child,
                stdin,
            },
            status: ServerStatus::Connected,
        });

        Ok(format!("Server {} started", name))
    }
}

#[tauri::command]
async fn stop_mcp_server<R: Runtime>(
    app: tauri::AppHandle<R>,
    name: String,
    state: State<'_, ServerManager>,
) -> Result<String, String> {
    let mut servers = state.0.servers.lock().await;
    if let Some(server) = servers.remove(&name) {
        if let McpTransport::Stdio { mut _process, .. } = server.transport {
            let _ = _process.kill().await;
        }
        update_status(&app, name.clone(), ServerStatus::Disconnected).await;
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
        let mut pending = state.0.pending_requests.lock().await;
        pending.insert(id.clone(), tx);
    }

    let mut servers = state.0.servers.lock().await;
    if let Some(server) = servers.get_mut(&name) {
        match &mut server.transport {
            McpTransport::Stdio { stdin, .. } => {
                let req_str = serde_json::to_string(&request).map_err(|e| e.to_string())?;
                stdin.write_all(req_str.as_bytes()).await.map_err(|e| e.to_string())?;
                stdin.write_all(b"\n").await.map_err(|e| e.to_string())?;
                stdin.flush().await.map_err(|e| e.to_string())?;
            }
            McpTransport::Sse { url, client } => {
                let res = client.post(url.as_str())
                    .json(&request)
                    .send()
                    .await
                    .map_err(|e| e.to_string())?;

                if !res.status().is_success() {
                    return Err(format!("SSE request failed: {}", res.status()));
                }
            }
        }
    } else {
        let mut pending = state.0.pending_requests.lock().await;
        pending.remove(&id);
        return Err("Server not found".to_string());
    }

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
            send_mcp_request,
            get_mcp_servers_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
