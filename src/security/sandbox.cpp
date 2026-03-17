// Copyright 2025 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0

#include "quantclaw/security/sandbox.hpp"

#include <algorithm>
#include <cctype>
#include <filesystem>
#include <regex>

#include <spdlog/spdlog.h>
#ifdef __linux__
#include <sys/resource.h>
#endif

namespace quantclaw {

Sandbox::Sandbox(const std::filesystem::path& workspace_path,
                 const std::vector<std::string>& allowed_paths,
                 const std::vector<std::string>& denied_paths,
                 const std::vector<std::string>& allowed_commands,
                 const std::vector<std::string>& denied_commands)
    : workspace_path_(workspace_path),
      allowed_paths_(allowed_paths),
      denied_paths_(denied_paths),
      allowed_commands_(allowed_commands),
      denied_commands_(denied_commands) {
  for (const auto& cmd : denied_commands_) {
    denied_cmd_patterns_.push_back(
        std::regex(cmd, std::regex_constants::icase));
  }
}

bool Sandbox::IsPathAllowed(const std::string& path) const {
  std::filesystem::path resolved_path = std::filesystem::absolute(path);

  // Check against denied paths first
  for (const auto& denied_path : denied_paths_) {
    std::filesystem::path denied_resolved =
        std::filesystem::absolute(denied_path);
    if (resolved_path.string().find(denied_resolved.string()) == 0) {
      return false;
    }
  }

  // If allowed paths are specified, check against them
  if (!allowed_paths_.empty()) {
    for (const auto& allowed_path : allowed_paths_) {
      std::filesystem::path allowed_resolved =
          std::filesystem::absolute(allowed_path);
      if (resolved_path.string().find(allowed_resolved.string()) == 0) {
        return true;
      }
    }
    return false;
  }

  return true;
}

bool Sandbox::IsCommandAllowed(const std::string& command) const {
  for (const auto& pattern : denied_cmd_patterns_) {
    if (std::regex_search(command, pattern)) {
      return false;
    }
  }
  return true;
}

std::string Sandbox::SanitizePath(const std::string& path) const {
  std::filesystem::path clean_path =
      std::filesystem::path(path).lexically_normal();
  if (clean_path.string().substr(0, 2) == "..") {
    throw std::runtime_error("Path traversal detected: " + path);
  }
  return clean_path.string();
}

bool Sandbox::ValidateFilePath(const std::string& path,
                               const std::string& workspace) {
  namespace fs = std::filesystem;
  std::error_code ec;

  // Resolve the workspace root to an absolute canonical-ish form.
  fs::path ws_abs = fs::absolute(workspace, ec);
  if (ec)
    return false;
  ws_abs = ws_abs.lexically_normal();

  // Resolve the requested path.
  fs::path path_abs = fs::absolute(path, ec);
  if (ec)
    return false;
  path_abs = path_abs.lexically_normal();

  // Basic traversal check.
  std::string path_str = path_abs.string();
  if (path_str.find("..") != std::string::npos) {
    return false;
  }

  // Ensure the resolved path is inside the workspace.
  std::string ws_str = ws_abs.string();
  if (path_str.size() < ws_str.size()) {
    return false;
  }
  // Prefix match (case-sensitive on Linux, case-insensitive on Windows).
#ifdef _WIN32
  auto to_lower = [](std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return std::tolower(c); });
    return s;
  };
  if (to_lower(path_str).rfind(to_lower(ws_str), 0) != 0)
    return false;
#else
  if (path_str.rfind(ws_str, 0) != 0)
    return false;
#endif

  return true;
}

bool Sandbox::ValidateShellCommand(const std::string& command) {
  // Block obviously dangerous commands
  static const std::vector<std::regex> dangerous_patterns = {
      std::regex(R"(\brm\s+-rf\s+/)", std::regex_constants::icase),
      std::regex(R"(\bmkfs\b)", std::regex_constants::icase),
      std::regex(R"(\bdd\s+if=)", std::regex_constants::icase),
  };

  for (const auto& pattern : dangerous_patterns) {
    if (std::regex_search(command, pattern)) {
      return false;
    }
  }
  return true;
}

void Sandbox::ApplyResourceLimits() {
  // Resource limits are now applied inside exec_capture() on the child
  // process (via fork + setrlimit before exec on Linux). Calling setrlimit
  // on the host process would permanently cap the gateway itself.
  // This function is intentionally a no-op; the actual enforcement lives
  // in process_unix.cpp.
}

}  // namespace quantclaw
