const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { Resource } = require("@opentelemetry/resources");
const { trace } = require("@opentelemetry/api");
const { AWSXRayIdGenerator } = require("@opentelemetry/id-generator-aws-xray");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { AWSXRayPropagator } = require("@opentelemetry/propagator-aws-xray");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-grpc");
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { AwsInstrumentation } = require('@opentelemetry/instrumentation-aws-sdk');

module.exports = (serviceName) => {
  const tracerConfig = {
    idGenerator: new AWSXRayIdGenerator(),
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) => {
          return req.url.includes("healthz");
        }
      }),
      new ExpressInstrumentation(),
      new AwsInstrumentation({
        suppressInternalInstrumentation: true
      })
    ],
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      })
    ),
  };

  const tracerProvider = new NodeTracerProvider(tracerConfig);
  const otlpExporter = new OTLPTraceExporter();

  tracerProvider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
  tracerProvider.register({
    propagator: new AWSXRayPropagator(),
  });

  return trace.getTracer("");
};
