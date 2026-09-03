export class AIProvider {
  async generateResponse() { throw new Error("NOT_IMPLEMENTED"); }
}

export class OpenAIProvider extends AIProvider {
  constructor({apiKey, model = "gpt-5"} = {}) { super(); this.apiKey = apiKey; this.model = model; }

  async generateResponse({instructions, input, tools, stream = false}) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required for OpenAIProvider");
    const response = await fetch("https://api.openai.com/v1/responses", {method:"POST", headers:{"content-type":"application/json", authorization:`Bearer ${this.apiKey}`}, body:JSON.stringify({model:this.model, instructions, input, tools, stream})});
    if (!response.ok) throw new Error(`OPENAI_HTTP_${response.status}`);
    return stream ? response.body : response.json();
  }
}

export class FakeProvider extends AIProvider {
  constructor(responses = []) { super(); this.responses = [...responses]; this.calls = []; }
  async generateResponse(request) { this.calls.push(request); return this.responses.shift() ?? {output_text:"I need more information.", output:[]}; }
}
