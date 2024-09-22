import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const WEBHOOK_URL = 'https://webhook.site/c86183b2-ae9b-47e6-b48c-3f5c975825fc';
const BASE_URL = 'https://api.openweathermap.org/';
const LOCATION = 'Tokyo';
const API_KEY = 'dbc6b0f32de6d95d3885a9ca7a774bd9';

declare const _STD_: any;

if (typeof _STD_ === "undefined") {
  // If _STD_ is not defined, we know it's not running in the Acurast Cloud.
  // Define _STD_ here for local testing.
  console.log("Running in local environment");
  (global as any)._STD_ = {
    app_info: { version: "local" },
    job: { getId: () => "local" },
    device: { getAddress: () => "local" },
  };
}

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

// Generate two account credentials
// Each account has a private key, a public key, and an address
const alice = Account.generate();
const bob = Account.generate();

// send it to your backend
fetch(`${BASE_URL}data/2.5/weather?q=${LOCATION}&appid=${API_KEY}`)
  .then((response) => response.json())
  .then((data) => {
    const condition = data["weather"][0]["main"];
    return fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condition,
        timestamp: Date.now(),
        acurast: {
          version: _STD_.app_info.version,
          deploymentId: _STD_.job.getId(),
          deviceAddress: _STD_.device.getAddress(),
        },
      }),
    })
      .then((postResponse) => console.log("Success:", postResponse.status))
      .catch((error) => console.error("Error posting data:", error));
  })
  .catch((error) => console.error("Error getting data:", error));




