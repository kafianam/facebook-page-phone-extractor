function extractPhone() {
    const spans = document.querySelectorAll("span");

    const phoneRegex = /(01[3-9]\d{8})|(\+8801[3-9]\d{8})|(01\d{2,3}[-\s]?\d{6})/g;

    for (let span of spans) {
        if (span.innerText) {
            const match = span.innerText.match(phoneRegex);
            if (match) {
                return match[0];
            }
        }
    }

    return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "extract") {
        const phone = extractPhone();
        const url = window.location.href;

        sendResponse({ phone, url });
    }
});
