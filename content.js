function extractPhone() {
    // Updated regex: supports +880, hyphen, and space
    const phoneRegex = /(\+?88)?01[3-9]\d{2}[-\s]?\d{6}/g;

    // 1️⃣ Check all text nodes (most reliable)
    const bodyText = document.body.innerText;
    const match = bodyText.match(phoneRegex);
    if (match) {
        // hyphen & space remove করে clean number
        return match[0].replace(/[-\s]/g, "");
    }

    // 2️⃣ Check tel: links
    const links = document.querySelectorAll('a[href^="tel"]');
    for (let link of links) {
        const tel = link.getAttribute("href");
        if (tel) {
            const clean = tel.replace("tel:", "").replace(/[-\s]/g, "");
            if (phoneRegex.test(clean)) return clean;
        }
    }

    return null;
}


// Simple page activity check (recent post indicator)
function isPageActive() {
    const bodyText = document.body.innerText.toLowerCase();
    return (
        bodyText.includes("hour") ||
        bodyText.includes("min") ||
        bodyText.includes("today") ||
        bodyText.includes("yesterday")
    );
}

// Business signal check
function hasBusinessSignal() {
    const bodyText = document.body.innerText.toLowerCase();
    return (
        bodyText.includes("call") ||
        bodyText.includes("contact") ||
        bodyText.includes("phone") ||
        bodyText.includes("message")
    );
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "extract") {
        const phone = extractPhone();
        const active = isPageActive();
        const business = hasBusinessSignal();

        let qualified = false;

        if (phone && active && business) {
            qualified = true;
        }

        sendResponse({
            phone,
            url: window.location.href,
            qualified,
            active,
            business
        });
    }
});
