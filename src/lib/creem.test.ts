import assert from "node:assert/strict";
import { getCreemApiMode, getCreemApiUrl } from "./creem";

process.env.CREEM_API_MODE = "test";
assert.equal(getCreemApiMode(), "test");
assert.equal(getCreemApiUrl(), "https://test-api.creem.io/v1");
process.env.CREEM_API_MODE = "production";
assert.equal(getCreemApiMode(), "production");
assert.equal(getCreemApiUrl(), "https://api.creem.io/v1");

console.log("Creem environment isolation tests passed.");
