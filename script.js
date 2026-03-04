const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const zoneCountText = document.getElementById('zoneCount');

const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let zones = [];
let popularityData = {};
let zoneFrame = null;

// Initialization
async function init() {
    await fetchPopularity();
    await listZones();
    
    // Listeners
    searchBar.addEventListener('input', filterZones);
    sortOptions.addEventListener('change', sortZones);
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
}

async function fetchPopularity() {
    try {
        const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
        const data = await response.json();
        data.forEach(file => {
            const idMatch = file.name.match(/\/(\d+)\.html$/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                popularityData[id] = file.hits.total;
            }
        });
    } catch (e) { console.log("Popularity stats unavailable"); }
}

async function listZones() {
    try {
        const response = await fetch(zonesURL);
        zones = await response.json();
        sortZones();
    } catch (error) {
        container.innerHTML = `Error: ${error}`;
    }
}

function sortZones() {
    const sortBy = sortOptions.value;
    if (sortBy === 'name') zones.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'id') zones.sort((a, b) => a.id - b.id);
    else if (sortBy === 'popular') zones.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
    
    displayZones(zones);
}

function displayZones(zonesToDisplay) {
    container.innerHTML = "";
    zonesToDisplay.forEach(zone => {
        const item = document.createElement("div");
        item.className = "zone-item";
        item.onclick = () => openZone(zone);

        const img = document.createElement("img");
        img.src = zone.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        
        const btn = document.createElement("button");
        btn.textContent = zone.name;

        item.append(img, btn);
        container.appendChild(item);
    });
    zoneCountText.textContent = `Zones Loaded: ${zonesToDisplay.length}`;
}

function filterZones() {
    const query = searchBar.value.toLowerCase();
    const filtered = zones.filter(z => z.name.toLowerCase().includes(query));
    displayZones(filtered);
}

function openZone(zone) {
    const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    
    if (url.startsWith("http") && !url.includes(htmlURL)) {
        window.location.href = url;
        return;
    }

    fetch(url).then(r => r.text()).then(html => {
        if (!zoneFrame) {
            zoneFrame = document.createElement("iframe");
            zoneFrame.id = "zoneFrame";
            zoneViewer.appendChild(zoneFrame);
        }
        zoneFrame.contentDocument.open();
        zoneFrame.contentDocument.write(html);
        zoneFrame.contentDocument.close();

        document.getElementById('zoneTitle').textContent = zone.name;
        document.getElementById('zoneId').textContent = `#${zone.id}`;
        zoneViewer.style.display = "block";
    });
}

function closeZone() {
    zoneViewer.style.display = "none";
    if (zoneFrame) {
        zoneFrame.remove();
        zoneFrame = null;
    }
}

function fullscreenZone() {
    const f = document.getElementById('zoneFrame');
    if (f?.requestFullscreen) f.requestFullscreen();
}

function aboutBlank() {
    const newWin = window.open("about:blank", "_blank");
    const id = document.getElementById('zoneId').textContent.replace('#','');
    const zone = zones.find(z => z.id == id);
    const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    
    fetch(url).then(r => r.text()).then(html => {
        newWin.document.write(html);
        newWin.document.close();
    });
}

function saveData() {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], {type: "text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "backup.data";
    a.click();
}

function loadData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        for (let key in data) localStorage.setItem(key, data[key]);
        alert("Data restored!");
    };
    reader.readAsText(event.target.files[0]);
}

init();
