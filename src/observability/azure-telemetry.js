let azureTracer = null;
let initialized = false;

export async function registerAzureTelemetry() {
  if (initialized) return;
  initialized = true;
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return;

  const [{AzureMonitorTraceExporter}, {BasicTracerProvider, BatchSpanProcessor}, {resourceFromAttributes}] = await Promise.all([
    import("@azure/monitor-opentelemetry-exporter"),
    import("@opentelemetry/sdk-trace-base"),
    import("@opentelemetry/resources"),
  ]);
  const exporter = new AzureMonitorTraceExporter({connectionString});
  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({
      "service.name": "fulcrum",
      "service.namespace": "fulcrum",
      "deployment.environment": process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    }),
    spanProcessors: [
      new BatchSpanProcessor(exporter, {
        scheduledDelayMillis: 500,
        exportTimeoutMillis: 5000,
        maxQueueSize: 256,
        maxExportBatchSize: 32,
      }),
    ],
  });
  azureTracer = provider.getTracer("fulcrum.ai.azure", "1.0.0");
}

export function getAzureTracer() {
  return azureTracer;
}
