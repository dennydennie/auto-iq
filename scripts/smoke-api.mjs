const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

async function smoke() {
  const response = await fetch(`${baseUrl}/health/live`);

  if (!response.ok) {
    throw new Error(`API smoke failed with status ${response.status}`);
  }

  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
}

smoke().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
