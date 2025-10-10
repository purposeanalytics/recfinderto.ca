const https = require("https");
const fs = require("fs");
const path = require("path");

const datasetId = "1a5be46a-4039-48cd-a2d2-8e702abf9516";
const targetName = "Drop-in.json";
const outputPath = path.join("public", "Drop-in.json");

// Helper to fetch JSON from a URL
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = [];
            res.on("data", chunk => data.push(chunk));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(Buffer.concat(data).toString());
                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            });
        }).on("error", reject);
    });
}

// Helper to download a file
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${res.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on("finish", () => {
                file.close(resolve);
            });
        }).on("error", reject);
    });
}

// Main logic
fetchJSON(`https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=${datasetId}`)
    .then(data => {
        const resources = data.result.resources;
        const dropInResource = resources.find(r => r.name === targetName);

        if (!dropInResource || !dropInResource.url) {
            throw new Error(`Resource "${targetName}" not found in dataset.`);
        }

        console.log(`Downloading ${dropInResource.url}...`);
        return downloadFile(dropInResource.url, outputPath);
    })
    .then(() => {
        console.log(`Saved Drop-in data to ${outputPath}`);
    })
    .catch(err => {
        console.error("Error:", err.message);
    });