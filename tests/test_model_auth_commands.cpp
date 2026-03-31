// Copyright 2025 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0

#include <filesystem>
#include <memory>
#include <sstream>
#include <vector>

#include <spdlog/sinks/null_sink.h>
#include <spdlog/spdlog.h>

#include "quantclaw/auth/openai_codex_auth.hpp"
#include "quantclaw/cli/model_auth_commands.hpp"

#include "test_helpers.hpp"
#include <gtest/gtest.h>

namespace quantclaw::cli {
namespace {

std::shared_ptr<spdlog::logger> make_logger(const std::string& name) {
  auto sink = std::make_shared<spdlog::sinks::null_sink_mt>();
  return std::make_shared<spdlog::logger>(name, sink);
}

class FakeOAuthClient : public auth::OpenAICodexOAuthClient {
 public:
  explicit FakeOAuthClient(std::shared_ptr<spdlog::logger> logger)
      : OpenAICodexOAuthClient(std::move(logger)) {}

  auth::OpenAICodexAuthRecord login_result;
  int login_calls = 0;

  auth::OpenAICodexAuthRecord LoginInteractive(std::istream& /*in*/,
                                               std::ostream& /*out*/) override {
    ++login_calls;
    return login_result;
  }
};

}  // namespace

TEST(ModelAuthCommandsTest, StatusWithoutCredentialsReportsLoggedOut) {
  const auto dir = test::MakeTestDir("model_auth_status");

  std::istringstream input;
  std::ostringstream output;
  std::ostringstream error;
  auto logger = make_logger("model-auth-status");
  auto client = std::make_shared<FakeOAuthClient>(logger);

  ModelAuthCommandContext ctx;
  ctx.logger = logger;
  ctx.oauth_client = client;
  ctx.store = auth::OpenAICodexAuthStore(dir / "openai-codex.json");
  ctx.in = &input;
  ctx.out = &output;
  ctx.err = &error;

  const int rc =
      HandleModelsAuthCommand({"status", "--provider", "openai-codex"}, ctx);

  EXPECT_EQ(rc, 0);
  EXPECT_NE(output.str().find("Not logged in"), std::string::npos);
}

TEST(ModelAuthCommandsTest, LoginStoresCredentials) {
  const auto dir = test::MakeTestDir("model_auth_login");

  std::istringstream input;
  std::ostringstream output;
  std::ostringstream error;
  auto logger = make_logger("model-auth-login");
  auto client = std::make_shared<FakeOAuthClient>(logger);
  client->login_result.provider = "openai-codex";
  client->login_result.access_token = "oauth-access";
  client->login_result.refresh_token = "oauth-refresh";
  client->login_result.account_id = "acct_123";
  client->login_result.expires_at = 4102444800;

  ModelAuthCommandContext ctx;
  ctx.logger = logger;
  ctx.oauth_client = client;
  ctx.store = auth::OpenAICodexAuthStore(dir / "openai-codex.json");
  ctx.in = &input;
  ctx.out = &output;
  ctx.err = &error;

  const int rc =
      HandleModelsAuthCommand({"login", "--provider", "openai-codex"}, ctx);

  EXPECT_EQ(rc, 0);
  EXPECT_EQ(client->login_calls, 1);
  EXPECT_NE(output.str().find("Logged in"), std::string::npos);

  auto saved = ctx.store.Load();
  ASSERT_TRUE(saved.has_value());
  EXPECT_EQ(saved->access_token, "oauth-access");
  EXPECT_EQ(saved->refresh_token, "oauth-refresh");
}

TEST(ModelAuthCommandsTest, LogoutClearsStoredCredentials) {
  const auto dir = test::MakeTestDir("model_auth_logout");
  const auto path = dir / "openai-codex.json";

  auth::OpenAICodexAuthStore store(path);
  auth::OpenAICodexAuthRecord record;
  record.provider = "openai-codex";
  record.access_token = "oauth-access";
  record.refresh_token = "oauth-refresh";
  record.expires_at = 4102444800;
  store.Save(record);

  std::istringstream input;
  std::ostringstream output;
  std::ostringstream error;
  auto logger = make_logger("model-auth-logout");
  auto client = std::make_shared<FakeOAuthClient>(logger);

  ModelAuthCommandContext ctx;
  ctx.logger = logger;
  ctx.oauth_client = client;
  ctx.store = store;
  ctx.in = &input;
  ctx.out = &output;
  ctx.err = &error;

  const int rc =
      HandleModelsAuthCommand({"logout", "--provider", "openai-codex"}, ctx);

  EXPECT_EQ(rc, 0);
  EXPECT_NE(output.str().find("Logged out"), std::string::npos);
  EXPECT_FALSE(std::filesystem::exists(path));
}

}  // namespace quantclaw::cli
