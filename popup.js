let licenseValid = false;

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

        // ▶ Extract button
        extractBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "extract" }, async (response) => {
                    if (!response || !response.phone) {
                        status.innerText = "No phone number found!";
                        return;
                    }

                    const { phone, url } = response;

                    // Already saved list load করি
                    let saved = await chrome.storage.local.get(["phoneList"]);
                    let phoneList = saved.phoneList || [];

                    // নতুন row যোগ করি
                    phoneList.push({
                        phone: phone,
                        url: url,
                        time: new Date().toLocaleString()
                    });

                    chrome.storage.local.set({ phoneList });

                    status.innerText = "Saved: " + phone;
                });
            });
        });

        // ▶ Download CSV button
        downloadBtn.addEventListener("click", async () => {
            let saved = await chrome.storage.local.get(["phoneList"]);
            let phoneList = saved.phoneList || [];

            if (phoneList.length === 0) {
                alert("No extracted data!");
                return;
            }

            // CSV তৈরি
            let csv = "Phone,URL,Time\n";
            phoneList.forEach(row => {
                csv += `${row.phone},${row.url},${row.time}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url: url,
                filename: "phone_numbers.csv"
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", init);
