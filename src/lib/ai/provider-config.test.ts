import assert from "node:assert/strict";
import {
  DEFAULT_DEEPSEEK_API_URL,
  DEFAULT_DEEPSEEK_MODEL,
  getDeepSeekApiUrl,
  getDeepSeekJsonRequestDefaults,
  getDeepSeekModel,
} from "./provider-config";

assert.equal(DEFAULT_DEEPSEEK_MODEL, "deepseek-v4-flash");
assert.equal(getDeepSeekModel({}), "deepseek-v4-flash");
assert.equal(getDeepSeekModel({ DEEPSEEK_MODEL: "deepseek-v4-pro" }), "deepseek-v4-pro");
assert.equal(getDeepSeekModel({ DEEPSEEK_MODEL: " invalid model " }), "deepseek-v4-flash");

assert.equal(getDeepSeekApiUrl({}), DEFAULT_DEEPSEEK_API_URL);
assert.equal(
  getDeepSeekApiUrl({ DEEPSEEK_API_URL: "https://provider.example/v1/chat/completions" }),
  "https://provider.example/v1/chat/completions",
);
assert.equal(
  getDeepSeekApiUrl({ DEEPSEEK_API_URL: "http://provider.example/v1/chat/completions" }),
  DEFAULT_DEEPSEEK_API_URL,
);

assert.deepEqual(getDeepSeekJsonRequestDefaults({}), {
  model: "deepseek-v4-flash",
  thinking: { type: "disabled" },
  response_format: { type: "json_object" },
});

console.log("DeepSeek provider configuration tests passed");
