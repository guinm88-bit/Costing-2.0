const YARN_COUNTS = ["6s","10s","14s","17s","26s","32s","40s","60s","84s","100s","2/17s","2/40s","2/60s","2/80s","33K","56K","100K"];
const REED_MAP = {"6s":28,"10s":36,"14s":42,"17s":48,"26s":52,"32s":56,"40s":64,"60s":72,"84s":84,"100s":96,"2/17s":32,"2/40s":48,"2/60s":52,"2/80s":64,"33K":48,"56K":56,"100K":72};

let yarnPrices = JSON.parse(localStorage.getItem("yarnPrices")) || {};
let diffWarpSettings = null; // Default to null for fresh sessions
let diffWeftSettings = null; // Default to null for fresh sessions
let editMode = false;
let activeModalType = null;

window.onload = () => {
    populateDropdowns();
    initToggles();
    
    // Default values
    document.getElementById("weftWidth").value = Number(document.getElementById("warpWidth").value) - 2;
    document.getElementById("weftLength").value = Number(document.getElementById("warpLength").value) - 2;

    // Listeners for auto-fill width/length
    document.getElementById("warpWidth").oninput = (e) => {
        document.getElementById("weftWidth").value = Number(e.target.value) - 2;
        calculate();
    };
    document.getElementById("warpLength").oninput = (e) => {
        document.getElementById("weftLength").value = Number(e.target.value) - 2;
        calculate();
    };

    // Dyeing auto-fill logic
    document.getElementById("fabricColour").onchange = (e) => {
        const dyeCharge = document.getElementById("dyeCharge");
        const dyePercent = document.getElementById("dyePercent");
        if (e.target.value === "white") {
            dyeCharge.value = 0;
            dyePercent.value = 0;
        } else {
            dyeCharge.value = 300;
            dyePercent.value = 100;
        }
        calculate();
    };

    autofillPrices();
    calculate();
};

function populateDropdowns() {
    const selects = ["warpCount", "weftCount", "diffYarnCount"];
    selects.forEach(id => {
        const s = document.getElementById(id);
        YARN_COUNTS.forEach(c => s.innerHTML += `<option value="${c}">${c}</option>`);
    });
}

function initToggles() {
    ["Warp", "Weft"].forEach(type => {
        const toggle = document.getElementById(`enableDiff${type}Yarn`);
        const btn = document.getElementById(`addDiff${type}Btn`);
        toggle.checked = false; // Always OFF by default as requested
        btn.style.display = 'none';
        toggle.onchange = (e) => {
            btn.style.display = e.target.checked ? 'block' : 'none';
            if(!e.target.checked) type === "Warp" ? diffWarpSettings = null : diffWeftSettings = null;
            calculate();
        };
    });
}

function togglePriceEdit() {
    editMode = !editMode;
    document.getElementById("priceWrapper").classList.toggle("hidden", !editMode);
    document.getElementById("editPriceBtn").textContent = editMode ? "SAVE & LOCK PRICES" : "Set Yarn Prices";
    if (!editMode) localStorage.setItem("yarnPrices", JSON.stringify(yarnPrices)), autofillPrices(), calculate();
    renderPriceGrid();
}

function renderPriceGrid() {
    const list = document.getElementById("priceList");
    list.innerHTML = "";
    YARN_COUNTS.forEach(c => {
        list.innerHTML += `<div><label>${c}</label><input type="number" inputmode="decimal" value="${yarnPrices[c] || 0}" ${editMode ? "" : "readonly"} oninput="yarnPrices['${c}']=Number(this.value)"></div>`;
    });
}

function autofillPrices() {
    document.getElementById("warpPrice").value = yarnPrices[document.getElementById("warpCount").value] || 0;
    document.getElementById("weftPrice").value = yarnPrices[document.getElementById("weftCount").value] || 0;
}

const getEffCount = (l) => {
    // 33K is now treated like other K counts (Value/2)
    let b = (l === "100K") ? 50 : (l === "56K") ? 28 : (l === "33K") ? 16.5 : Number(l.replace("2/", "").replace("s", ""));
    return (l.startsWith("2/") || b === 84 || b === 100) ? b / 2 : b;
};

const getBund = (l) => {
    let b = (l === "100K") ? 50 : (l === "56K") ? 28 : (l === "33K") ? 16.5 : Number(l.replace("2/", "").replace("s", ""));
    return (b === 84 || b === 100) ? 10 : 5;
};

function calculate() {
    const warpC = document.getElementById("warpCount").value;
    const weftC = document.getElementById("weftCount").value;
    const res = { warpPata: 0, weftPata: 0, dWpata: 0, dWfpata: 0, wCost: 0, fCost: 0, dCost: 0, yCost: 0 };

    // Warp Calculation
    let totalWThreads = Number(document.getElementById("warpWidth").value) * Number(document.getElementById("reed").value) * Number(document.getElementById("warpPly").value);
    if (document.getElementById("enableDiffWarpYarn").checked && diffWarpSettings) {
        let dThreads = totalWThreads * (diffWarpSettings.propDiff / (diffWarpSettings.propBase + diffWarpSettings.propDiff));
        totalWThreads -= dThreads;
        res.dWpata = (dThreads * diffWarpSettings.ply * Number(document.getElementById("warpLength").value)) / diffWarpSettings.yarnLength;
        res.dCost += res.dWpata * (diffWarpSettings.bundlePrice / getEffCount(diffWarpSettings.count) / getBund(diffWarpSettings.count));
        if(diffWarpSettings.colour === 'colour') res.yCost += (4600 / getEffCount(diffWarpSettings.count) / getBund(diffWarpSettings.count) * res.dWpata / 1000) * diffWarpSettings.dyeCharge;
    }
    res.warpPata = (totalWThreads * Number(document.getElementById("warpLength").value)) / Number(document.getElementById("warpYarnLength").value) + Number(document.getElementById("warpWaste").value);
    res.wCost = res.warpPata * (Number(document.getElementById("warpPrice").value) / getEffCount(warpC) / getBund(warpC));

    // Weft Calculation
    let totalFThreads = Number(document.getElementById("weftWidth").value) * Number(document.getElementById("pick").value) * Number(document.getElementById("weftPly").value);
    if (document.getElementById("enableDiffWeftYarn").checked && diffWeftSettings) {
        let dThreads = totalFThreads * (diffWeftSettings.propDiff / (diffWeftSettings.propBase + diffWeftSettings.propDiff));
        totalFThreads -= dThreads;
        res.dWfpata = (dThreads * diffWeftSettings.ply * Number(document.getElementById("weftLength").value)) / diffWeftSettings.yarnLength;
        res.dCost += res.dWfpata * (diffWeftSettings.bundlePrice / getEffCount(diffWeftSettings.count) / getBund(diffWeftSettings.count));
        if(diffWeftSettings.colour === 'colour') res.yCost += (4600 / getEffCount(diffWeftSettings.count) / getBund(diffWeftSettings.count) * res.dWfpata / 1000) * diffWeftSettings.dyeCharge;
    }
    res.weftPata = (totalFThreads * Number(document.getElementById("weftLength").value)) / Number(document.getElementById("weftYarnLength").value);
    res.fCost = res.weftPata * (Number(document.getElementById("weftPrice").value) / getEffCount(weftC) / getBund(weftC));

    // Base Dyeing Cost
    let dyeBase = (4600/getEffCount(warpC)/getBund(warpC)*res.warpPata + 4600/getEffCount(weftC)/getBund(weftC)*res.weftPata)/1000 * (Number(document.getElementById("dyePercent").value)/100) * Number(document.getElementById("dyeCharge").value);
    res.yCost += dyeBase;

    // Display Results
    document.getElementById("warpResult").textContent = res.warpPata.toFixed(2);
    document.getElementById("warpDiffResult").textContent = res.dWpata.toFixed(2);
    document.getElementById("weftResult").textContent = res.weftPata.toFixed(2);
    document.getElementById("weftDiffResult").textContent = res.dWfpata.toFixed(2);
    document.getElementById("warpYarnCost").textContent = res.wCost.toFixed(0);
    document.getElementById("weftYarnCost").textContent = res.fCost.toFixed(0);
    document.getElementById("diffYarnCost").textContent = res.dCost.toFixed(0);
    document.getElementById("dyeCost").textContent = res.yCost.toFixed(0);
    
    let total = res.wCost + res.fCost + res.dCost + res.yCost + Number(document.getElementById("wage").value) + Number(document.getElementById("wash").value) + Number(document.getElementById("other").value);
    
    document.getElementById("totalAmt").textContent = total.toFixed(0);
    document.getElementById("costResult").textContent = (total / 12).toFixed(2);
}

function openDiffYarnModal(type) {
    activeModalType = type;
    document.getElementById("diffYarnModal").style.display = 'flex';
    document.getElementById("diffYarnType").textContent = type;
    let s = type === 'warp' ? diffWarpSettings : diffWeftSettings;
    if(s) {
        document.getElementById("diffYarnCount").value = s.count;
        document.getElementById("diffYarnBundlePrice").value = s.bundlePrice;
        document.getElementById("diffYarnPly").value = s.ply;
        document.getElementById("diffYarnColour").value = s.colour || 'colour';
        document.getElementById("diffYarnDyeCharge").value = s.dyeCharge || 300;
    } else {
        let count = document.getElementById(type+"Count").value;
        document.getElementById("diffYarnCount").value = count;
        document.getElementById("diffYarnBundlePrice").value = yarnPrices[count] || 0;
    }
}

function saveDiffYarnSettings() {
    let s = {
        count: document.getElementById("diffYarnCount").value,
        ply: Number(document.getElementById("diffYarnPly").value),
        propBase: Number(document.getElementById("diffYarnPropBase").value),
        propDiff: Number(document.getElementById("diffYarnPropDiff").value),
        yarnLength: Number(document.getElementById("diffYarnLength").value),
        colour: document.getElementById("diffYarnColour").value,
        dyeCharge: Number(document.getElementById("diffYarnDyeCharge").value),
        bundlePrice: Number(document.getElementById("diffYarnBundlePrice").value)
    };
    activeModalType === 'warp' ? diffWarpSettings = s : diffWeftSettings = s;
    closeDiffYarnModal();
    calculate();
}

function closeDiffYarnModal() { document.getElementById("diffYarnModal").style.display = 'none'; }

document.getElementById("warpCount").onchange = () => {
    let v = document.getElementById("warpCount").value;
    document.getElementById("reed").value = REED_MAP[v] || 0;
    document.getElementById("pick").value = REED_MAP[v] || 0;
    document.getElementById("weftCount").value = v;
    autofillPrices(); 
    calculate();
};

document.getElementById("weftCount").onchange = () => {
    autofillPrices();
    calculate();
};

// Standard input listener for recalculation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', calculate);
});