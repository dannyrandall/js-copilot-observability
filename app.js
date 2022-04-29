'use strict';

const tracer = require('./tracer')('movies-js');
const express = require("express");
const opentelemetry = require('@opentelemetry/api');
const aws = require("aws-sdk");

const app = express();
const port = 8080;
const s3 = new aws.S3({apiVersion: '2006-03-01'})

app.get("/healthz", (req, res) => {
	res.status(200).send();
})

app.get("/js-copilot-observability", (req, res) => {
	const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
	const traceId = getXRayTraceId(span)

	s3.listBuckets((err, data) => {
		if (err) {
			console.error("[%s] %s", traceId, err)
			res.status(500).send("Error listing buckets: " + err.message)
			return
		}

		console.log("[%s] Returning buckets", traceId)
		res.send({"buckets": data.Buckets});
	})
});

app.listen(port, () => {
	console.log(`Listening for requests on http://localhost:${port}`);
});

function getXRayTraceId(span) {
	const id = span.spanContext().traceId
	if (id.length < 9) {
		return id;
	}

	return "1-" + id.substring(0, 8) + "-" + id.substring(8);
}