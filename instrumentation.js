import {registerOTel} from "@vercel/otel";
import {registerAzureTelemetry} from "./src/observability/azure-telemetry.js";

export async function register() {
  registerOTel({
    serviceName: "fulcrum",
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: ["openai.azure.com", "cognitiveservices.azure.com"],
      },
    },
  });
  await registerAzureTelemetry();
}
