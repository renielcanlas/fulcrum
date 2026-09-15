import {registerOTel} from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: "fulcrum",
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: ["openai.azure.com", "cognitiveservices.azure.com"],
      },
    },
  });
}
