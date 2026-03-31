// Copyright 2025 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0

#pragma once

#include <istream>
#include <memory>
#include <ostream>
#include <string>
#include <vector>

#include <spdlog/spdlog.h>

#include "quantclaw/auth/openai_codex_auth.hpp"

namespace quantclaw::cli {

struct ModelAuthCommandContext {
  std::shared_ptr<spdlog::logger> logger;
  std::shared_ptr<auth::OpenAICodexOAuthClient> oauth_client;
  auth::OpenAICodexAuthStore store;
  std::istream* in = nullptr;
  std::ostream* out = nullptr;
  std::ostream* err = nullptr;
};

int HandleModelsAuthCommand(const std::vector<std::string>& args,
                            ModelAuthCommandContext ctx);

}  // namespace quantclaw::cli
