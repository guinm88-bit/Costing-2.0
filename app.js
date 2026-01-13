// Get references to all necessary HTML elements
const warpCount = document.getElementById("warpCount");
const warpPly = document.getElementById("warpPly");
const warpWidth = document.getElementById("warpWidth");
const reed = document.getElementById("reed");
const warpLength = document.getElementById("warpLength");
const warpYarnLength = document.getElementById("warpYarnLength");
const warpWaste = document.getElementById("warpWaste");
const warpResult = document.getElementById("warpResult"); // Span for Warp Pata result

const weftCount = document.getElementById("weftCount");
const weftPly = document.getElementById("weftPly");
const weftWidth = document.getElementById("weftWidth");
const pick = document.getElementById("pick");
const weftLength = document.getElementById("weftLength");
const weftYarnLength = document.getElementById("weftYarnLength");
const fabricColour = document.getElementById("fabricColour");
const weftResult = document.getElementById("weftResult"); // Span for Weft Pata result

const dyeCharge = document.getElementById("dyeCharge");
const dyePercent = document.getElementById("dyePercent");
const wage = document.getElementById("wage");
const other = document.getElementById("other");
const wash = document.getElementById("wash"); // Wash input from the BUNDLE PRICES section

const warpYarnCost = document.getElementById("warpYarnCost"); // Span for Warp Cost result
const weftYarnCost = document.getElementById("weftYarnCost"); // Span for Weft Cost result
const diffYarnCost = document.getElementById("diffYarnCost"); // Span for Different Yarn Cost result
const dyeCost = document.getElementById("dyeCost");           // Span for Dye Cost result
const costResult = document.getElementById("costResult");     // Span for Final Cost per Meter result

const warpPrice = document.getElementById("warpPrice");     // Input for Warp Bundle Price
const weftPrice = document.getElementById("weftPrice");     // Input for Weft Bundle Price

const priceWrapper = document.getElementById("priceWrapper");
const priceList = document.getElementById("priceList");
const editPriceBtn = document.getElementById("editPriceBtn");

// --- DIFFERENT YARN MODAL ELEMENTS ---
const diffYarnModal = document.getElementById("diffYarnModal");
const diffYarnType = document.getElementById("diffYarnType"); // To show 'Warp' or 'Weft'
const diffYarnCount = document.getElementById("diffYarnCount");
const diffYarnPly = document.getElementById("diffYarnPly");
const diffYarnPropBase = document.getElementById("diffYarnPropBase");
const diffYarnPropDiff = document.getElementById("diffYarnPropDiff");
const diffYarnLength = document.getElementById("diffYarnLength");
const diffYarnColour = document.getElementById("diffYarnColour");
const diffYarnDyeCharge = document.getElementById("diffYarnDyeCharge");
const diffYarnBundlePrice = document.getElementById("diffYarnBundlePrice");
const diffYarnCalcPata = document.getElementById("diffYarnCalcPata"); // Display calculated pata
const diffYarnCalcAmount = document.getElementById("diffYarnCalcAmount"); // Display calculated amount (cost)
const diffYarnCalcDyeCost = document.getElementById("diffYarnCalcDyeCost"); // Display calculated dye cost

// --- Different Yarn Enable/Disable Toggles ---
const enableDiffWarpYarn = document.getElementById("enableDiffWarpYarn");
const addDiffWarpBtn = document.getElementById("addDiffWarpBtn");
const enableDiffWeftYarn = document.getElementById("enableDiffWeftYarn");
const addDiffWeftBtn = document.getElementById("addDiffWeftBtn");


// Global variables to store different yarn settings AFTER "OK" is clicked
let activeDiffYarnFor = null; // 'warp' or 'weft'
let diffWarpSettings = JSON.parse(localStorage.getItem("diffWarpSettings")) || null;
let diffWeftSettings = JSON.parse(localStorage.getItem("diffWeftSettings")) || null;


// --- Data Definitions ---
const yarnCounts = [
  "6s","10s","14s","17s","26s","32s","40s","60s","84s","100s",
  "2/17s","2/40s","2/60s","2/80s",
  "33s","56K","100K"
];

const reedPickMap = {
  "6s":28,"10s":36,"14s":42,"17s":48,"26s":52,"32s":56,"40s":64,"60s":72,"84s":84,"100s":96,
  "2/17s":32,"2/40s":48,"2/60s":52,"2/80s":64,
  "33s":48,"56K":56,"100K":72
};


// Populate dropdowns with yarn counts
yarnCounts.forEach(c=>{
  warpCount.innerHTML+=`<option value="${c}">${c}</option>`;
  weftCount.innerHTML+=`<option value="${c}">${c}</option>`;
  diffYarnCount.innerHTML+=`<option value="${c}">${c}</option>`; // Populate different yarn dropdown
});


// --- Helper Functions for Calculations ---

// Determines the base numeric value of a yarn count string
function baseCount(l){
  if(l==="100K") return 50;
  if(l==="56K") return 28;
  if(l==="33s") return 16.5; // Specific override for "33s"
  return Number(l.replace("2/","").replace("s",""));
}

// Determines the "effective" count for specific calculations
function effectiveCount(l){
  if(l.startsWith("2/")) return baseCount(l)/2;
  const c=baseCount(l);
  if(c===84||c===100) return c/2;
  return c;
}

// Determines pata per bundle for specific calculations
function pataPerBundle(l){
  const c=baseCount(l);
  if(c===84||c===100) return 10;
  return 5;
}


// --- Event Listeners for Auto-fills & Recalculation ---

// Autofill Reed, Pick, Weft Count, and prices when Warp Count changes
warpCount.onchange=()=>{
  reed.value=reedPickMap[warpCount.value]||"";
  pick.value=reedPickMap[warpCount.value]||""; // Pick defaults to Reed
  weftCount.value=warpCount.value; // Weft Count defaults to Warp Count
  autofillPrices();
  calculate(); // Recalculate immediately
};

// Autofill Weft Prices when Weft Count changes
weftCount.onchange=()=> {
  autofillPrices();
  calculate(); // Recalculate immediately
};

// Autofill Weft Ply when Warp Ply changes
warpPly.oninput=()=>{
  weftPly.value=warpPly.value;
  calculate(); // Recalculate immediately
};

// Autofill Weft Width when Warp Width changes (Warp Width - 2)
warpWidth.oninput=()=>{
  weftWidth.value=Number(warpWidth.value)-2;
  calculate(); // Recalculate immediately
};

// Autofill Weft Thaan Length when Warp Thaan Length changes (Warp Length - 2)
warpLength.oninput=()=>{
  weftLength.value=Number(warpLength.value)-2;
  calculate(); // Recalculate immediately
};

// Adjust Dyeing Charge and Percentage based on Fabric Colour
fabricColour.onchange=()=>{
  if(fabricColour.value==="white"){
    dyePercent.value=0;
    dyeCharge.value=0;
  }else{
    dyePercent.value=100;
    dyeCharge.value=300;
  }
  calculate(); // Recalculate immediately
};

// Add general input listeners to trigger calculation on any input change
document.querySelectorAll('input[type="number"], select').forEach(input => {
    // Exclude dropdowns from this general listener, as they have specific onchange already
    // And exclude price-input class which is handled by renderPrices for dynamic inputs
    // And exclude the diff yarn toggle inputs
    if (!input.classList.contains('price-input') && !input.id.includes('Count') && !input.id.includes('fabricColour') && !input.id.startsWith('enableDiff')) {
        input.oninput = calculate; // oninput for number fields
    }
});
// Ensure the warpCount and weftCount also trigger calculation if prices change via autofill
// and ensure prices inputs also trigger calculation
warpPrice.oninput = calculate;
weftPrice.oninput = calculate;

// --- Different Yarn Toggle Listeners ---
enableDiffWarpYarn.onchange = () => {
    const isEnabled = enableDiffWarpYarn.checked;
    addDiffWarpBtn.style.display = isEnabled ? 'block' : 'none';
    if (!isEnabled) {
        diffWarpSettings = null; // Clear settings when disabled
        localStorage.removeItem("diffWarpSettings");
    }
    calculate(); // Recalculate to reflect enable/disable
};

enableDiffWeftYarn.onchange = () => {
    const isEnabled = enableDiffWeftYarn.checked;
    addDiffWeftBtn.style.display = isEnabled ? 'block' : 'none';
    if (!isEnabled) {
        diffWeftSettings = null; // Clear settings when disabled
        localStorage.removeItem("diffWeftSettings");
    }
    calculate(); // Recalculate to reflect enable/disable
};


// --- MAIN CALCULATION FUNCTION ---
function calculate(){
  // --- Parse Input Values (converting to numbers) ---
  const p_warpWidth = Number(warpWidth.value);
  const p_reed = Number(reed.value);
  const p_warpLength = Number(warpLength.value);
  const p_warpPly = Number(warpPly.value);
  const p_warpYarnLength = Number(warpYarnLength.value);
  const p_warpWaste = Number(warpWaste.value || 0);

  const p_weftWidth = Number(weftWidth.value);
  const p_pick = Number(pick.value);
  const p_weftLength = Number(weftLength.value);
  const p_weftPly = Number(weftPly.value);
  const p_weftYarnLength = Number(weftYarnLength.value);

  const p_dyeCharge = Number(dyeCharge.value);
  const p_dyePercent = Number(dyePercent.value); // Will be / 100 for calculation
  const p_wage = Number(wage.value || 0);
  const p_wash = Number(wash.value || 0);
  const p_other = Number(other.value || 0);

  const p_warpBundlePrice = Number(warpPrice.value || 0);
  const p_weftBundlePrice = Number(weftPrice.value || 0);

  // --- Different Yarn specific totals ---
  let totalDiffYarnCost = 0;
  let totalDiffYarnDyeingCost = 0;
  
  // --- Basic Validation to prevent division by zero or NaN results ---
  const isAnyBaseYarnInvalid = (
      [p_warpWidth, p_reed, p_warpLength, p_warpPly, p_warpYarnLength, p_weftWidth,
       p_pick, p_weftLength, p_weftPly, p_weftYarnLength, p_dyeCharge, p_dyePercent,
       p_wage, p_wash, p_other, p_warpBundlePrice, p_weftBundlePrice
      ].some(val => isNaN(val)) ||
      p_warpYarnLength === 0 || p_weftYarnLength === 0 ||
      effectiveCount(warpCount.value) === 0 || pataPerBundle(warpCount.value) === 0 ||
      effectiveCount(weftCount.value) === 0 || pataPerBundle(weftCount.value) === 0
  );

  if (isAnyBaseYarnInvalid) {
      setResultsToZero();
      return;
  }

  // --- Calculate total potential threads for Warp and Weft (single strands equivalent) ---
  const potentialTotalWarpThreads = p_warpWidth * p_reed * p_warpPly; // Use base ply for total strands
  const potentialTotalWeftThreads = p_weftWidth * p_pick * p_weftPly; // Use base ply for total strands

  let actualBaseWarpThreadsForPata = potentialTotalWarpThreads;
  let actualBaseWeftThreadsForPata = potentialTotalWeftThreads;


  // --- Apply Different Warp Yarn Logic (if enabled) ---
  if (enableDiffWarpYarn.checked && diffWarpSettings && diffWarpSettings.propDiff > 0 && diffWarpSettings.propBase > 0 && (diffWarpSettings.propBase + diffWarpSettings.propDiff) > 0) {
      const propBase = Number(diffWarpSettings.propBase);
      const propDiff = Number(diffWarpSettings.propDiff);
      const proportionTotal = propBase + propDiff;

      const diffWarpYarnThreads = potentialTotalWarpThreads * (propDiff / proportionTotal);
      actualBaseWarpThreadsForPata = potentialTotalWarpThreads * (propBase / proportionTotal);

      // Calculate Different Warp Yarn Pata - NOW MULTIPLY BY ITS OWN PLY!
      const diffWarpPata = (diffWarpYarnThreads * Number(diffWarpSettings.ply) * p_warpLength) / Number(diffWarpSettings.yarnLength);
      
      const diffWc = effectiveCount(diffWarpSettings.count);
      const diffWd = pataPerBundle(diffWarpSettings.count);
      
      // Cost for Different Warp Yarn
      totalDiffYarnCost += diffWarpPata * (Number(diffWarpSettings.bundlePrice) / diffWc / diffWd);

      // Dyeing Cost for Different Warp Yarn
      if (diffWarpSettings.colour === 'colour') {
          totalDiffYarnDyeingCost += (4600 / diffWc / diffWd * diffWarpPata / 1000) *
                                (100 / 100) * Number(diffWarpSettings.dyeCharge);
      }
  }

  // --- Apply Different Weft Yarn Logic (if enabled) ---
  if (enableDiffWeftYarn.checked && diffWeftSettings && diffWeftSettings.propDiff > 0 && diffWeftSettings.propBase > 0 && (diffWeftSettings.propBase + diffWeftSettings.propDiff) > 0) {
      const propBase = Number(diffWeftSettings.propBase);
      const propDiff = Number(diffWeftSettings.propDiff);
      const proportionTotal = propBase + propDiff;

      const diffWeftYarnThreads = potentialTotalWeftThreads * (propDiff / proportionTotal);
      actualBaseWeftThreadsForPata = potentialTotalWeftThreads * (propBase / proportionTotal);

      // Calculate Different Weft Yarn Pata - NOW MULTIPLY BY ITS OWN PLY!
      const diffWeftPata = (diffWeftYarnThreads * Number(diffWeftSettings.ply) * p_weftLength) / Number(diffWeftSettings.yarnLength);

      const diffWc = effectiveCount(diffWeftSettings.count);
      const diffWd = pataPerBundle(diffWeftSettings.count);
      
      // Cost for Different Weft Yarn
      totalDiffYarnCost += diffWeftPata * (Number(diffWeftSettings.bundlePrice) / diffWc / diffWd);

      // Dyeing Cost for Different Weft Yarn
      if (diffWeftSettings.colour === 'colour') {
          totalDiffYarnDyeingCost += (4600 / diffWc / diffWd * diffWeftPata / 1000) *
                                (100 / 100) * Number(diffWeftSettings.dyeCharge);
      }
  }


  // --- Result 1: Base Warp Pata Calculation (using potentially reduced actualBaseWarpThreadsForPata) ---
  // The ply for the base yarn is implicitly handled in actualBaseWarpThreadsForPata calculation.
  const calculatedWarpPata =
    (actualBaseWarpThreadsForPata * p_warpLength) / p_warpYarnLength + p_warpWaste;
  warpResult.textContent = calculatedWarpPata.toFixed(3);


  // --- Result 2: Base Weft Pata Calculation (using potentially reduced actualBaseWeftThreadsForPata) ---
  const calculatedWeftPata =
    (actualBaseWeftThreadsForPata * p_weftLength) / p_weftYarnLength;
  weftResult.textContent = calculatedWeftPata.toFixed(3);


  // --- Base Yarn Cost Calculation ---
  const wc = effectiveCount(warpCount.value);
  const wd = pataPerBundle(warpCount.value);
  const wfc = effectiveCount(weftCount.value);
  const wfd = pataPerBundle(weftCount.value);

  const calculatedWarpCost = calculatedWarpPata * (p_warpBundlePrice / wc / wd);
  const calculatedWeftCost = calculatedWeftPata * (p_weftBundlePrice / wfc / wfd);

  warpYarnCost.textContent = calculatedWarpCost.toFixed(2);
  weftYarnCost.textContent = calculatedWeftCost.toFixed(2);
  diffYarnCost.textContent = totalDiffYarnCost.toFixed(2); // Display total different yarn cost


  // --- Total Dyeing Cost (Base + Different Yarns) ---
  const calculatedBaseDye =
    ((4600 / wc / wd * calculatedWarpPata + 4600 / wfc / wfd * calculatedWeftPata) / 1000) *
    (p_dyePercent / 100) * // Convert percentage to decimal
    p_dyeCharge;
  
  const totalDyeingCost = calculatedBaseDye + totalDiffYarnDyeingCost;
  dyeCost.textContent = totalDyeingCost.toFixed(2);


  // --- Final Cost per Meter Calculation ---
  const totalCostBeforeDivision =
    calculatedWarpCost +
    calculatedWeftCost +
    totalDiffYarnCost + // Add total different yarn cost
    totalDyeingCost +   // Use total combined dyeing cost
    p_wage +
    p_wash +
    p_other;

  const finalCostPerMeter = (totalCostBeforeDivision / 12); // Divide by 12 as per spec
  costResult.textContent = finalCostPerMeter.toFixed(2);
}

// Helper to set all result spans to zero
function setResultsToZero() {
    warpResult.textContent = (0).toFixed(3);
    weftResult.textContent = (0).toFixed(3);
    diffYarnCost.textContent = (0).toFixed(2);
    warpYarnCost.textContent = (0).toFixed(2);
    weftYarnCost.textContent = (0).toFixed(2);
    dyeCost.textContent = (0).toFixed(2);
    costResult.textContent = (0).toFixed(2);
}


// --- Yarn Price Management (using browser's localStorage) ---
let yarnPrices=JSON.parse(localStorage.getItem("yarnPrices"))||{};
let editPrices=false;

function renderPrices(){
  priceList.innerHTML="";
  yarnCounts.forEach(c=>{
    priceList.innerHTML+=`
      <div class="price-row">
        <label>${c}</label>
        <input type="number" class="price-input" value="${yarnPrices[c]||0}"
          ${editPrices?"":"readonly"}
          oninput="yarnPrices['${c}']=Number(this.value)||0; calculate();">
      </div>`;
  });
}

function togglePriceEdit(){
  editPrices=!editPrices;
  priceWrapper.classList.toggle("hidden",!editPrices);
  editPriceBtn.textContent=editPrices?"Save Prices":"Set / Edit Prices";

  if(!editPrices) {
    localStorage.setItem("yarnPrices",JSON.stringify(yarnPrices));
    autofillPrices();
  }
  renderPrices();
  calculate();
}

function autofillPrices(){
  warpPrice.value=yarnPrices[warpCount.value]||0;
  weftPrice.value=yarnPrices[weftCount.value]||0;
  // If modal is open, try to autofill different yarn price too
  if (diffYarnModal.style.display === 'flex' && diffYarnCount.value) {
      diffYarnBundlePrice.value = yarnPrices[diffYarnCount.value] || 0;
  }
}


// --- DIFFERENT YARN MODAL FUNCTIONS ---

// Auto-calculates pata, amount, and dye cost within the modal itself for review
function calculateDiffYarnModal(){
    const currentDiffType = diffYarnType.textContent.toLowerCase(); // 'warp' or 'weft'
    let currentMainWidth = 0;
    let currentMainReedPick = 0;
    let currentMainPly = 0;
    let currentMainThaanLength = 0;
    let currentMainYarnLength = 0; // The yarn length for the main yarn, for diff yarn pata calc

    if (currentDiffType === 'warp') {
        currentMainWidth = Number(warpWidth.value);
        currentMainReedPick = Number(reed.value);
        currentMainPly = Number(warpPly.value);
        currentMainThaanLength = Number(warpLength.value);
        currentMainYarnLength = Number(warpYarnLength.value);
    } else if (currentDiffType === 'weft') {
        currentMainWidth = Number(weftWidth.value);
        currentMainReedPick = Number(pick.value);
        currentMainPly = Number(weftPly.value);
        currentMainThaanLength = Number(weftLength.value);
        currentMainYarnLength = Number(weftYarnLength.value);
    }
    
    // Total potential threads for the main yarn section (Warp or Weft), based on its own ply
    const potentialTotalThreads = currentMainWidth * currentMainReedPick * currentMainPly;

    const propBase = Number(diffYarnPropBase.value || 0);
    const propDiff = Number(diffYarnPropDiff.value || 0);
    const diffYarnCountVal = diffYarnCount.value;
    const diffYarnPlyVal = Number(diffYarnPly.value || 1); // Get ply from modal input
    const diffYarnLenVal = Number(diffYarnLength.value || 3100);
    const diffYarnBundleP = Number(diffYarnBundlePrice.value || 0);
    const diffYarnDyeC = Number(diffYarnDyeCharge.value || 0);
    const diffYarnColourVal = diffYarnColour.value;

    if (potentialTotalThreads === 0 || (propBase + propDiff) === 0 || diffYarnLenVal === 0 ||
        effectiveCount(diffYarnCountVal) === 0 || pataPerBundle(diffYarnCountVal) === 0) {
        diffYarnCalcPata.textContent = (0).toFixed(3);
        diffYarnCalcAmount.textContent = (0).toFixed(2);
        diffYarnCalcDyeCost.textContent = (0).toFixed(2);
        return;
    }

    // Calculate threads for the different yarn based on proportion
    const diffYarnTotalThreads = potentialTotalThreads * (propDiff / (propBase + propDiff));
    
    // Calculate Pata for the different yarn - now correctly using its own ply
    const diffPata = (diffYarnTotalThreads * diffYarnPlyVal * currentMainThaanLength) / diffYarnLenVal;
    diffYarnCalcPata.textContent = diffPata.toFixed(3);

    const diffWc = effectiveCount(diffYarnCountVal);
    const diffWd = pataPerBundle(diffYarnCountVal);

    // Calculate cost (amount) for the different yarn
    const diffCost = diffPata * (diffYarnBundleP / diffWc / diffWd);
    diffYarnCalcAmount.textContent = diffCost.toFixed(2);

    // Calculate dyeing cost for the different yarn
    let calculatedModalDye = 0;
    if (diffYarnColourVal === 'colour') {
        // Use 100% dye for different yarn if it's 'colour'
        calculatedModalDye = (4600 / diffWc / diffWd * diffPata / 1000) * (100 / 100) * diffYarnDyeC;
    }
    diffYarnCalcDyeCost.textContent = calculatedModalDye.toFixed(2);
}

// Open the modal
function openDiffYarnModal(type) {
  activeDiffYarnFor = type;
  diffYarnType.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  
  let settingsToLoad = type === 'warp' ? diffWarpSettings : diffWeftSettings;
  if (settingsToLoad) {
      diffYarnCount.value = settingsToLoad.count;
      diffYarnPly.value = settingsToLoad.ply;
      diffYarnPropBase.value = settingsToLoad.propBase;
      diffYarnPropDiff.value = settingsToLoad.propDiff;
      diffYarnLength.value = settingsToLoad.yarnLength;
      diffYarnColour.value = settingsToLoad.colour;
      diffYarnDyeCharge.value = settingsToLoad.dyeCharge;
      diffYarnBundlePrice.value = settingsToLoad.bundlePrice;
  } else {
      // Set initial defaults for new entry
      diffYarnCount.value = yarnCounts[0];
      diffYarnPly.value = (type === 'warp' ? Number(warpPly.value) : Number(weftPly.value)); // Default to main ply
      diffYarnPropBase.value = 9;
      diffYarnPropDiff.value = 1;
      diffYarnLength.value = (type === 'warp' ? Number(warpYarnLength.value) : Number(weftYarnLength.value)); // Default to main yarn length
      diffYarnColour.value = 'colour';
      diffYarnDyeCharge.value = 300;
      diffYarnBundlePrice.value = yarnPrices[yarnCounts[0]] || 0;
  }
  
  diffYarnCount.onchange = autofillPrices; // To get correct bundle price
  // Re-attach listeners for modal fields to update live calculations in modal
  document.querySelectorAll('#diffYarnModal input, #diffYarnModal select').forEach(input => {
    input.oninput = calculateDiffYarnModal;
    input.onchange = calculateDiffYarnModal;
  });

  autofillPrices(); // Autofill price based on diffYarnCount
  calculateDiffYarnModal(); // Perform initial calculation in modal
  diffYarnModal.style.display = 'flex'; // Show modal
}

// Close the modal
function closeDiffYarnModal() {
  diffYarnModal.style.display = 'none';
  activeDiffYarnFor = null;
  calculate(); // Recalculate main app after closing modal to reflect new/removed diff yarn
}

// Save settings from modal to global variables
function saveDiffYarnSettings() {
  const settings = {
      count: diffYarnCount.value,
      ply: Number(diffYarnPly.value || 1),
      propBase: Number(diffYarnPropBase.value || 0),
      propDiff: Number(diffYarnPropDiff.value || 0),
      yarnLength: Number(diffYarnLength.value || 3100),
      colour: diffYarnColour.value,
      dyeCharge: Number(diffYarnDyeCharge.value || 0),
      bundlePrice: Number(diffYarnBundlePrice.value || 0)
  };

  if (activeDiffYarnFor === 'warp') {
      diffWarpSettings = settings;
      localStorage.setItem("diffWarpSettings", JSON.stringify(settings));
  } else if (activeDiffYarnFor === 'weft') {
      diffWeftSettings = settings;
      localStorage.setItem("diffWeftSettings", JSON.stringify(settings));
  }
  closeDiffYarnModal(); // Close after saving
}


// --- Initial Setup when the page loads ---
window.onload=()=>{
  // Set initial auto-filled values
  weftWidth.value=Number(warpWidth.value)-2;
  weftLength.value=Number(warpLength.value)-2;

  // Initialize prices and dropdowns
  renderPrices();
  
  // Load saved diff yarn toggle states and apply
  enableDiffWarpYarn.checked = !!diffWarpSettings;
  addDiffWarpBtn.style.display = enableDiffWarpYarn.checked ? 'block' : 'none';
  enableDiffWeftYarn.checked = !!diffWeftSettings;
  addDiffWeftBtn.style.display = enableDiffWeftYarn.checked ? 'block' : 'none';


  // Manually trigger the warpCount change to set initial reed, pick, weftCount defaults
  // and ensure initial prices are loaded into the main inputs before first calc
  if(warpCount.options.length > 0) {
      warpCount.value = yarnCounts[0]; // Set default selection to the first item
      // Trigger the onchange logic explicitly
      const event = new Event('change');
      warpCount.dispatchEvent(event);
  } else {
      calculate(); // If no yarn counts, just calculate with defaults
  }

  // Handle closing modal with Escape key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && diffYarnModal.style.display === 'flex') {
      closeDiffYarnModal();
    }
  });
};