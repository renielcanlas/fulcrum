export class AIProvider {
  async generateResponse() { throw new Error("NOT_IMPLEMENTED"); }
}

export class OpenAIProvider extends AIProvider {
  constructor({apiKey, model = "gpt-5"} = {}) { super(); this.apiKey = apiKey; this.model = model; }

  async generateResponse({instructions, input, tools, text, stream = false, previousResponseId}) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required for OpenAIProvider");
    const response = await fetch("https://api.openai.com/v1/responses", {method:"POST", headers:{"content-type":"application/json", authorization:`Bearer ${this.apiKey}`}, body:JSON.stringify({model:this.model, instructions, input, tools, text, stream, previous_response_id: previousResponseId})});
    if (!response.ok) throw new Error(`OPENAI_HTTP_${response.status}`);
    return stream ? response.body : response.json();
  }
}

export class AzureOpenAIProvider extends AIProvider {
  constructor({endpoint, apiKey, deployment, apiVersion = "v1"} = {}) { super(); this.endpoint = endpoint?.replace(/\/$/, ""); this.apiKey = apiKey; this.deployment = deployment; this.apiVersion = apiVersion; }

  async generateResponse({instructions, input, tools, text, stream = false, previousResponseId}) {
    if (!this.endpoint || !this.apiKey || !this.deployment) throw new Error("AZURE_AI_FOUNDRY configuration is incomplete");
    if (this.apiVersion !== "v1") throw new Error("AZURE_AI_FOUNDRY_API_VERSION must be v1");
    const response = await fetch(`${this.endpoint}/openai/v1/responses`, {method: "POST", headers: {accept: "application/json", "content-type": "application/json", "api-key": this.apiKey}, body: JSON.stringify({model: this.deployment, instructions, input, tools, text, stream, previous_response_id: previousResponseId})});
    if (!response.ok) {
      const detail = await response.text();
      let message = "";
      try { message = JSON.parse(detail).error?.message ?? ""; } catch {}
      throw new Error(`AZURE_AI_FOUNDRY_HTTP_${response.status}${message ? `: ${message}` : ""}`);
    }
    return stream ? response.body : response.json();
  }
}

export class FakeProvider extends AIProvider {
  constructor(responses = []) { super(); this.responses = [...responses]; this.calls = []; }
  async generateResponse(request) { this.calls.push(request); return this.responses.shift() ?? {output_text:"I need more information.", output:[]}; }
}
