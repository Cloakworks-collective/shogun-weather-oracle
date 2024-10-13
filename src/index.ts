import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

const BASE_URL = 'https://api.openweathermap.org/';
const LOCATION = 'Tokyo';
const API_KEY = 'OPENWEATHERMAP_API_KEY_HERE';
const WEATHERMAN_PK = 'WEATHERMAN_PRIVATE_KEY_HERE';
const WARLORD_ADDRESS = '0xee1dada4f9bbce01099f0bf865475f3a273f63afb02e473005ef289ceed5c44c';

enum WeatherConditionEnum {
  CLEAR = "0",
  CLOUDS = "1",
  SNOW = "2",
  RAIN = "3",
  DRIZZLE = "4",
  THUNDERSTORM = "5",
}

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

async function getWeatherData() {
  const response = await fetch(`${BASE_URL}data/2.5/weather?q=${LOCATION}&appid=${API_KEY}`);
  const data = await response.json();
  const condition = data["weather"][0]["main"];
  console.log(`Weather condition in ${LOCATION}: ${condition}`);
  return condition;
}

function weatherConditionToNumber(condition: string): string {
  switch (condition.toUpperCase()) {
    case 'CLEAR':
      return WeatherConditionEnum.CLEAR;
    case 'CLOUDS':
      return WeatherConditionEnum.CLOUDS;
    case 'SNOW':
      return WeatherConditionEnum.SNOW;
    case 'RAIN':
      return WeatherConditionEnum.RAIN;
    case 'DRIZZLE':
      return WeatherConditionEnum.DRIZZLE;
    case 'THUNDERSTORM':
      return WeatherConditionEnum.THUNDERSTORM;
    default:
      console.warn(`Unknown weather condition: ${condition}. Defaulting to CLEAR.`);
      return WeatherConditionEnum.CLEAR;
  }
}

async function callWeatherChange(weatherCondition: string) {
  // Setup the client
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);


  // get the weatherman's account
  const privateKey = new Ed25519PrivateKey(WEATHERMAN_PK);
  const weatherman  = Account.fromPrivateKey({ privateKey });
  console.log(`weatherman's address is: ${weatherman.accountAddress}`);
  

  // build the transaction
  const txn = await aptos.transaction.build.simple({
    sender: weatherman.accountAddress,
    data: {
      // All transactions on Aptos are implemented via smart contracts.
      function: `${WARLORD_ADDRESS}::warlords::set_weather`,
      functionArguments: [weatherCondition],
    },
  });
 
  // Both signs and submits
  console.log("signing and submitting transaction ...");
  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: weatherman,
    transaction: txn,
  });

  // Waits for Aptos to verify and execute the transaction
  console.log("waiting for transaction to be executed ...");
  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: committedTxn.hash,
  });

  console.log("Transaction hash:", executedTransaction.hash);
}

async function fetchAndPostWeatherData() {
  try {
    const condition = await getWeatherData();
    const conditionNumber = weatherConditionToNumber(condition);
    try {
      await callWeatherChange(conditionNumber);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  } catch (error) {
    console.error("Error getting data:", error);
  }
}

fetchAndPostWeatherData();









