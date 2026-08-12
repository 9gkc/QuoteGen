const generateButton = document.querySelector(".generate");
const autoButton = document.querySelector(".auto");
const stopButton = document.querySelector(".stop");
const copyButton = document.querySelector(".copy");
const quoteElement = document.querySelector(".quote-display");
const quoteIdElement = document.querySelector(".quote-id");
const statusElement = document.querySelector(".auto-status");

let autoPlayTimer = null;
let quotesPromise = null;
let currentQuote = null;

function setStatus(message, tone = "info") {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}

function randomIndex(length) {
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) return Math.floor(Math.random() * length);
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / length) * length;
  do {
    cryptoSource.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % length;
}

async function getQuotes() {
  if (!quotesPromise) {
    quotesPromise = fetch("quotes.json", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`Quote data returned ${response.status}.`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Quote data is not an array.");
        const validQuotes = data.filter((quote) => (
          quote && typeof quote.text === "string" && quote.text.trim() && quote.id !== undefined
        ));
        if (validQuotes.length === 0) throw new Error("No valid quotes were found.");
        return validQuotes;
      })
      .catch((error) => {
        quotesPromise = null;
        throw error;
      });
  }
  return quotesPromise;
}

function displayQuote(quote) {
  currentQuote = quote;
  if (quoteElement) quoteElement.textContent = quote.text.trim();
  if (quoteIdElement) quoteIdElement.textContent = String(quote.id);
  if (copyButton) copyButton.disabled = false;
}

async function generateQuote() {
  if (generateButton) generateButton.disabled = true;
  setStatus("Loading a quote…");
  try {
    const quotes = await getQuotes();
    const nextQuote = quotes[randomIndex(quotes.length)];
    displayQuote(nextQuote);
    setStatus(autoPlayTimer ? "Auto: ON" : "Ready");
  } catch (error) {
    setStatus("Quotes are unavailable right now. Please try again later.", "error");
    console.error("Unable to load quotes", error);
  } finally {
    if (generateButton) generateButton.disabled = false;
  }
}

function startAutoPlay() {
  if (autoPlayTimer) return;
  autoPlayTimer = window.setInterval(generateQuote, 2_000);
  setStatus("Auto: ON");
  generateQuote();
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    window.clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
  setStatus(currentQuote ? "Auto: OFF" : "Ready");
}

async function copyQuote() {
  if (!currentQuote) return;
  try {
    await navigator.clipboard.writeText(currentQuote.text);
    setStatus(autoPlayTimer ? "Quote copied. Auto: ON" : "Quote copied.", "success");
  } catch (error) {
    setStatus("Copying was blocked. Select the quote and copy it manually.", "error");
    console.error("Unable to copy quote", error);
  }
}

generateButton?.addEventListener("click", generateQuote);
autoButton?.addEventListener("click", startAutoPlay);
stopButton?.addEventListener("click", stopAutoPlay);
copyButton?.addEventListener("click", copyQuote);
window.addEventListener("beforeunload", stopAutoPlay);
