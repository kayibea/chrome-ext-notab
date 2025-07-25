import type { Domain } from "./types";

const $ = document.getElementById.bind(document);
const list = $("domain-list") as HTMLUListElement;
const input = $("domain-input") as HTMLInputElement;
const form = $("add-form") as HTMLFormElement;

const STORAGE_KEY = "domains";
let domains: Domain[] = [];

function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  const hostname = input.value.trim();
  if (!isValidDomain(hostname)) {
    window.alert("Invalid domain format.");
    return;
  }

  if (domains.some((d) => d.hostname === hostname)) {
    window.alert("Domain already exists.");
    return;
  }

  const domain: Domain = { hostname, status: true };
  domains.push(domain);
  addDomainToList(domain);
  saveDomainsToStorage();
}

function addDomainToList(domain: Domain) {
  const li = document.createElement("li");

  const name = document.createElement("span");
  name.className = "domain-name";
  name.title = domain.hostname;
  name.textContent = domain.hostname;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "🗑";

  const switchLabel = document.createElement("label");
  switchLabel.className = "switch";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = domain.status;

  const slider = document.createElement("span");
  slider.className = "slider";

  switchLabel.appendChild(checkbox);
  switchLabel.appendChild(slider);

  li.appendChild(name);
  li.appendChild(deleteBtn);
  li.appendChild(switchLabel);

  list.appendChild(li);
}

function handleDeleteClick(e: Event) {
  const target = e.target as HTMLElement;
  if (!target.classList.contains("delete-btn")) return;

  const li = target.closest("li");
  const hostname = li?.querySelector(".domain-name")?.textContent?.trim();

  if (!hostname || !window.confirm(`Delete < ${hostname} > ?`)) return;

  li?.remove();
  domains = domains.filter((d) => d.hostname !== hostname);
  saveDomainsToStorage();
}

function handleToggleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.type !== "checkbox") return;

  const li = target.closest("li");
  const hostname = li?.querySelector(".domain-name")?.textContent?.trim();
  const domain = domains.find((d) => d.hostname === hostname);

  if (domain) {
    domain.status = target.checked;
    saveDomainsToStorage();
  }
}

function saveDomainsToStorage() {
  chrome.storage.local.set({ [STORAGE_KEY]: domains });
}

function loadDomainsFromStorage() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const stored = result[STORAGE_KEY] as Domain[] | undefined;
    if (!stored) return;

    domains = stored;
    for (const domain of domains) {
      addDomainToList(domain);
    }
  });
}

function getActiveTabHostname(callback: (hostname: string | null) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urlStr = tabs[0]?.url;
    if (!urlStr) return callback(null);

    try {
      const url = new URL(urlStr);
      callback(url.hostname);
    } catch {
      callback(null);
    }
  });
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function handleDOMContentLoaded() {
  loadDomainsFromStorage();

  getActiveTabHostname((hostname) => {
    if (hostname) input.value = hostname;
  });
}

form.addEventListener("submit", handleSubmit);
list.addEventListener("click", handleDeleteClick);
list.addEventListener("change", handleToggleChange);
window.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
