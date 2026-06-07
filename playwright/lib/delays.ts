export async function humanDelay(minMs = 1500, maxMs = 4000) {
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));
  await new Promise((resolve) => setTimeout(resolve, ms));
}
