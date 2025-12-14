let licenseValid = false;

// -------- License Check --------
async function checkLicense(key) {
    try {
        const res = await fetch("https://biddasoft.com/extractor/license.json", {
            cache: "no-store"
        });
        const data = await res.json();
        return data.keys.includes(key);
    } catch (e) {
        console.error("License check failed", e);
        return false;
    }
}

// -------- Quality Type Logic --------
function getQualityType(lead) {
    if (!lead.qualified) return "Low";

    let score = 0;
    if (lead.active) score++;
    if (lead.business) score++;
    // Optional: extra signals
    // e.g., if (lead.hasWhatsApp) score++;

    if (score >= 2) return "High";
    return "Medium";
}

// -------- Init Extension --------
async function init() {
    const extractBtn = document.getElementById("extractBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const status = document.getElementById("status");

    chrome.storage.local.get(["licenseKey"], async (result) => {
        let savedKey = result.licenseKey;

        if (!savedKey) {
            savedKey = prompt("Enter your license key to unlock:");
            if (!savedKey) {
                alert("License required! Extension disabled.");
                extractBtn.disabled = true;
                downloadBtn.disabled = true;
                return;
            }
            chrome.storage.local.set({ licenseKey: savedKey });
        }

        licenseValid = await checkLicense(savedKey);
        if (!licenseValid) {
            alert("Invalid license! Extension disabled.");
            chrome.storage.local.remove("licenseKey");
            extractBtn.disabled = true;
            downloadBtn.disabled = true;
            return;
        }

        extractBtn.disabled = false;
        downloadBtn.disabled = false;

        // -------- Extract Button --------
        extractBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "extract" }, async (res) => {

                    const qualityBox = document.getElementById("qualityBox");
                    const qualityLight = document.getElementById("qualityLight");
                    const qualityText = document.getElementById("qualityText");

                    if (!res || !res.phone) {
                        status.innerText = "No phone number found!";
                        status.style.color = "red";

                        qualityBox.style.display = "flex";
                        qualityLight.style.backgroundColor = "red";
                        qualityText.innerText = "Not Qualified Lead";
                        qualityText.style.color = "red";
                        return;
                    }

                    // ✅ Show quality result
                    qualityBox.style.display = "flex";
                    if (res.qualified) {
                        qualityLight.style.backgroundColor = "green";
                        qualityText.innerText = "Qualified Lead";
                        qualityText.style.color = "green";
                    } else {
                        qualityLight.style.backgroundColor = "red";
                        qualityText.innerText = "Not Qualified Lead";
                        qualityText.style.color = "red";
                    }

                    // -------- Save Lead with Quality & Type --------
                    let saved = await chrome.storage.local.get(["phoneList"]);
                    let phoneList = saved.phoneList || [];

                    const type = getQualityType(res);

                    phoneList.push({
                        phone: res.phone,
                        url: res.url,
                        quality: res.qualified ? "Qualified" : "Not Qualified",
                        type: type,
                        time: new Date().toLocaleString()
                    });

                    chrome.storage.local.set({ phoneList });

                    status.innerText = "Saved: " + res.phone;
                    status.style.color = "green";
                });
            });
        });

        // -------- Download CSV --------
   // -------- Download CSV --------
        downloadBtn.addEventListener("click", async () => {
            let saved = await chrome.storage.local.get(["phoneList"]);
            let phoneList = saved.phoneList || [];

            if (phoneList.length === 0) {
                alert("No extracted data!");
                return;
            }

            // CSV Header
            let csv = "Phone,URL,Time,Quality,Type\n";

            phoneList.forEach(row => {
                csv += `"${row.phone}","${row.url}","${row.time}","${row.quality}","${row.type}"\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url: url,
                filename: "phone_numbers.csv"
            });
        });

    });
}

document.addEventListener("DOMContentLoaded", init);
