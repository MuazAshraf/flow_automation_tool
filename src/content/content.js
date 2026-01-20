// Prevent duplicate script injection - STOP if already loaded
if (window.__VEOFLOW_LOADED__) {
  // Script already loaded, do nothing
} else {
  window.__VEOFLOW_LOADED__ = true;
  window.__VEOFLOW_PROCESSED_TASKS__ = window.__VEOFLOW_PROCESSED_TASKS__ || new Set();
  window.__VEOFLOW_IS_AUTOMATING__ = false;
  window.__VEOFLOW_SETTINGS_APPLIED__ = false;
  window.__VEOFLOW_TUNE_CLICKED__ = false;
  console.log("VeoFlow content script loaded");
}

// Use window-level state to persist across injections
const processedTaskIds = window.__VEOFLOW_PROCESSED_TASKS__;
let isAutomating = window.__VEOFLOW_IS_AUTOMATING__;

// Helper: Sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Wait for element with multiple selectors
async function waitForElement(selectors, timeout = 15000) {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  const startTime = Date.now();

  // Helper to check visibility using getBoundingClientRect
  const isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  return new Promise((resolve, reject) => {
    const check = () => {
      for (const selector of selectorList) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el && isVisible(el) && !el.disabled) {
            resolve(el);
            return;
          }
        }
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Elements not found: ${selectorList.join(", ")}`));
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}

// Helper: Find element by text content
function findElementByText(text, tagNames = ["button", "a", "span", "div"]) {
  const searchText = text.toLowerCase();

  // Helper to check visibility using getBoundingClientRect
  const isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  for (const tag of tagNames) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      const elText = (el.textContent || "").toLowerCase().trim();
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

      if (
        (elText.includes(searchText) || ariaLabel.includes(searchText)) &&
        isVisible(el)
      ) {
        return el;
      }
    }
  }
  return null;
}

// Helper: Find button by multiple text options
function findButton(textOptions) {
  for (const text of textOptions) {
    const btn = findElementByText(text, ["button"]);
    if (btn && !btn.disabled) {
      return btn;
    }
  }
  return null;
}

// Helper: Human-like click (single click only to avoid React double-handling)
async function clickElement(element) {
  if (!element) {
    throw new Error("Cannot click null element");
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(200);

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Simulate hover first
  element.dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true, clientX: x, clientY: y })
  );
  await sleep(50);

  // IMPORTANT: Only use ONE click method to avoid React handling multiple clicks
  // Using the native click() is most reliable for React apps
  element.click();

  await sleep(300);
  console.log(
    "Clicked element:",
    element.tagName,
    element.textContent?.substring(0, 30)
  );
}

// Helper: Paste text INSTANTLY into input (no character-by-character animation)
async function typeText(element, text, delay = 20, clearFirst = false) {
  element.focus();
  await sleep(100);

  // Clear existing content if requested (for bulk videos in same project)
  if (clearFirst) {
    // Select all content
    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      element.select();
    } else {
      // For contenteditable, use Selection API
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    await sleep(50);

    // Delete selected content using execCommand
    document.execCommand('delete', false, null);
    await sleep(100);
  }

  // INSTANT PASTE using execCommand('insertText')
  // This is the most reliable way to paste text instantly in React/Angular controlled inputs
  // It triggers proper framework state updates without character-by-character animation
  const pasted = document.execCommand('insertText', false, text);

  if (!pasted) {
    // Fallback: Direct value assignment + events (less reliable but works in some cases)
    console.log("execCommand failed, using fallback paste method");
    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      element.value = text;
    } else if (element.getAttribute("contenteditable")) {
      element.textContent = text;
    } else {
      element.textContent = text;
    }

    // Trigger events for fallback
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  await sleep(200); // Small delay after paste
  console.log("Pasted text INSTANTLY, length:", text.length);
}

// DEBUG: Log all visible buttons on the page
function debugLogAllButtons() {
  console.log("=== DEBUG: All visible buttons on page ===");
  const allButtons = document.querySelectorAll('button');
  let visibleCount = 0;

  for (const btn of allButtons) {
    // Use getBoundingClientRect for better visibility detection
    const rect = btn.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    if (!isVisible) continue; // Skip hidden
    visibleCount++;

    const text = (btn.textContent || "").trim().substring(0, 50);
    const ariaLabel = btn.getAttribute("aria-label") || "";
    const className = btn.className || "";
    const id = btn.id || "";
    const hasGoogleSymbol = btn.querySelector('.google-symbols, [class*="google-symbols"]') ? 'YES' : 'no';

    console.log(`Button ${visibleCount}:`, {
      text: text,
      ariaLabel: ariaLabel,
      id: id,
      className: className.substring(0, 50),
      disabled: btn.disabled,
      hasGoogleSymbol: hasGoogleSymbol
    });
  }

  console.log(`=== Total visible buttons: ${visibleCount} ===`);
  return visibleCount;
}

// Helper: Check if element is truly visible (better than offsetParent)
function isElementVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

// Step 1: Click "Start project" or "Create new" button
// IMPORTANT: Avoid clicking Edit, Save, Settings, or other unrelated buttons
async function clickStartProject() {
  console.log("Looking for start/create button...");

  // Wait for page to fully load
  await sleep(1000);

  // DEBUG: Log all buttons first
  debugLogAllButtons();

  // Buttons to AVOID (not the new project button)
  const avoidTexts = ["edit", "save", "settings", "delete", "cancel", "close", "menu", "more", "expand", "sign", "log", "account", "profile", "help", "feedback", "share", "tune"];
  const shouldAvoid = (btn) => {
    const text = (btn.textContent || "").toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return avoidTexts.some(avoid => text.includes(avoid) || ariaLabel.includes(avoid));
  };

  const allButtons = document.querySelectorAll('button');

  // Priority 0: Look for button with "add" icon + "project" text (Google Flow specific)
  // The button has: <i class="google-symbols">add_2</i>New project
  for (const btn of allButtons) {
    if (!isElementVisible(btn) || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const hasAddIcon = btn.querySelector('i.google-symbols, [class*="google-symbols"]');
    const text = (btn.textContent || "").toLowerCase();

    if (hasAddIcon && text.includes("project")) {
      console.log("Found Google Flow 'New project' button with add icon!");
      await clickElement(btn);
      console.log("Waiting 5 seconds for new project UI to load...");
      await sleep(5000);
      return true;
    }
  }

  // Priority 1: Look for "New project" button (exact match from Google Flow)
  const projectKeywords = ["new project", "start project", "create project", "new video", "create video"];
  for (const btn of allButtons) {
    if (!isElementVisible(btn) || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const text = (btn.textContent || "").toLowerCase().trim();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();

    for (const keyword of projectKeywords) {
      if (text.includes(keyword) || ariaLabel.includes(keyword)) {
        console.log("Found project button with text:", text.substring(0, 30));
        await clickElement(btn);
        // IMPORTANT: Wait longer for new project UI to fully load
        console.log("Waiting 5 seconds for new project UI to load...");
        await sleep(5000);
        return true;
      }
    }
  }

  // Priority 2: Look for button with + icon (add/create)
  for (const btn of allButtons) {
    if (!isElementVisible(btn) || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const innerHTML = btn.innerHTML || "";
    const text = (btn.textContent || "").toLowerCase();

    // Google Material icons: add, add_circle, add_box, plus
    const hasAddIcon = innerHTML.includes("add") || innerHTML.includes("plus") || innerHTML.includes("+");
    const hasProjectText = text.includes("project") || text.includes("new") || text.includes("create");

    if (hasAddIcon && hasProjectText) {
      console.log("Found add icon button with project text:", text.substring(0, 30));
      await clickElement(btn);
      await sleep(1500);
      return true;
    }
  }

  // Priority 3: Look for any "Create" or "New" button that's prominent
  const createKeywords = ["create", "new", "start", "begin", "make"];
  for (const btn of allButtons) {
    if (!isElementVisible(btn) || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const text = (btn.textContent || "").toLowerCase().trim();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();

    // Only match if the button text is short (likely a primary action button)
    if (text.length < 20) {
      for (const keyword of createKeywords) {
        if (text.includes(keyword) || ariaLabel.includes(keyword)) {
          console.log("Found create/new button:", text);
          await clickElement(btn);
          await sleep(1500);
          return true;
        }
      }
    }
  }

  // Priority 4: Look for FAB (floating action button) - often used for primary action
  const fabSelectors = [
    'button[class*="fab"]',
    'button[class*="floating"]',
    'button[class*="primary"]',
    'button[class*="action"]',
    '[role="button"][class*="fab"]'
  ];

  for (const selector of fabSelectors) {
    const fabs = document.querySelectorAll(selector);
    for (const fab of fabs) {
      if (isElementVisible(fab) && !fab.disabled && !shouldAvoid(fab)) {
        const text = (fab.textContent || "").toLowerCase();
        // Make sure it's not a navigation button
        if (!text.includes("back") && !text.includes("home")) {
          console.log("Found FAB button:", text.substring(0, 30));
          await clickElement(fab);
          await sleep(1500);
          return true;
        }
      }
    }
  }

  // Priority 5: Check if there's a textarea visible - might already be in create mode
  const textarea = document.querySelector('textarea:not([hidden])');
  if (textarea && isElementVisible(textarea)) {
    console.log("Textarea found - already in create mode, no need to click start");
    return true; // Already in create mode
  }

  console.log("No start button found - may already be in create mode or page structure is different");
  console.log("Please check the console logs above to see all available buttons");
  return false;
}

// Open settings panel if it exists (some settings might be behind a gear icon)
// Uses a global flag to ensure we only click the tune button ONCE per session
async function openSettingsIfNeeded() {
  console.log("VeoFlow: Checking if settings panel needs to be opened...");

  // GUARD: If we already opened settings in this session, don't open again
  if (window.__VEOFLOW_TUNE_CLICKED__) {
    console.log("VeoFlow: Tune button already clicked this session, skipping");
    return true;
  }

  // Look for settings/gear button that might need to be clicked
  // Priority: "tune" icon (Google Flow standard), then aria-labels
  const allButtons = Array.from(document.querySelectorAll('button'));

  for (const btn of allButtons) {
    if (!isElementVisible(btn)) continue;

    const text = (btn.textContent || "").toLowerCase();
    const iconText = btn.querySelector('i, span.material-icons, span.google-symbols')?.textContent || "";
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();

    const isTuneButton = (
      text.includes("tune") ||
      iconText.includes("tune") ||
      ariaLabel.includes("settings") ||
      ariaLabel.includes("options") ||
      ariaLabel.includes("tune")
    );

    if (isTuneButton) {
      console.log("VeoFlow: Found settings button:", text || iconText || ariaLabel);

      // Check if settings panel is already open
      const settingsPanel = document.querySelector('[role="dialog"][class*="Popover"], [class*="settings-panel"], [class*="PopoverContent"]');
      if (settingsPanel && isElementVisible(settingsPanel)) {
        console.log("VeoFlow: Settings panel already open");
        window.__VEOFLOW_TUNE_CLICKED__ = true; // Mark as clicked even if already open
        return true;
      }

      console.log("VeoFlow: Opening settings panel...");
      await clickElement(btn);
      window.__VEOFLOW_TUNE_CLICKED__ = true; // Mark tune button as clicked
      await sleep(500);
      return true;
    }
  }

  console.log("VeoFlow: No settings button found (settings may be directly accessible)");
  return false;
}

// Select model - handles both video (Veo) and image models
async function selectModel(modelValue, isImageMode = false) {
  if (!modelValue) return true;

  // Map for video models - EXACT text to search for in dropdown
  const videoModelMap = {
    "veo-3.1-fast": "3.1 - fast",
    "veo-3.1-quality": "3.1 - quality",
    "veo-2-fast": "2 - fast",
    "veo-2-quality": "2 - quality"
  };

  // Map for image models
  const imageModelMap = {
    "imagen-4": "imagen 4",
    "nano-banana": "nano banana",
    "nano-banana-pro": "banana pro"
  };

  const modelMap = isImageMode ? imageModelMap : videoModelMap;
  const targetText = (modelMap[modelValue] || modelValue).toLowerCase();

  console.log("VeoFlow: ===== SELECT MODEL =====");
  console.log("VeoFlow: modelValue:", modelValue);
  console.log("VeoFlow: targetText:", targetText);
  console.log("VeoFlow: isImageMode:", isImageMode);

  try {
    // Find button showing current model (contains "veo" for video, or image keywords)
    const modelKeywords = isImageMode ? ["imagen", "nano", "banana"] : ["veo"];
    const buttons = document.querySelectorAll('button');

    // Helper to check if this is the tune/settings button (should NOT click)
    const isTuneButton = (btn) => {
      const text = (btn.textContent || "").toLowerCase();
      const iconText = btn.querySelector('i, span.material-icons, span.google-symbols')?.textContent || "";
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
      return text.includes("tune") || iconText.includes("tune") ||
             ariaLabel.includes("settings") || ariaLabel.includes("tune");
    };

    for (const btn of buttons) {
      // Skip the tune/settings button
      if (isTuneButton(btn)) continue;

      const btnText = btn.textContent.toLowerCase();
      const hasModelKeyword = modelKeywords.some(kw => btnText.includes(kw));

      if (hasModelKeyword && isElementVisible(btn)) {
        console.log("VeoFlow: Found model button:", btnText.substring(0, 40));

        // Check if already showing correct model
        if (btnText.includes(targetText)) {
          console.log("VeoFlow: Model already correct!");
          return true;
        }

        // Click to open dropdown
        console.log("VeoFlow: Clicking to open model dropdown...");
        await clickElement(btn);
        await sleep(500);

        // Find all options and log them
        const options = document.querySelectorAll('[role="option"]');
        console.log("VeoFlow: Found", options.length, "options in dropdown");

        // Search through options
        for (const opt of options) {
          const optText = opt.textContent.toLowerCase();
          console.log("VeoFlow: Option:", optText.substring(0, 40));

          if (optText.includes(targetText) && isElementVisible(opt)) {
            console.log("VeoFlow: MATCH! Clicking:", optText.substring(0, 40));
            await clickElement(opt);
            await sleep(300);
            return true;
          }
        }

        // Close dropdown if nothing found
        console.log("VeoFlow: No match found, closing dropdown");
        document.body.click();
        await sleep(200);
        return true;
      }
    }

    console.log("VeoFlow: No model button found on page");
    return true;
  } catch (e) {
    console.error("VeoFlow: selectModel error:", e);
    return true;
  }
}

// Select aspect ratio - Google Flow uses "Landscape (16:9)" and "Portrait (9:16)"
async function selectRatio(ratio) {
  if (!ratio) return true;

  // Map setting value to what to search for
  const isLandscape = ratio === "landscape";
  // What we want
  const targetText = isLandscape ? "landscape" : "portrait";
  const targetRatio = isLandscape ? "16:9" : "9:16";
  // The OPPOSITE of what we want - used to detect if we need to change
  const oppositeText = isLandscape ? "portrait" : "landscape";
  const oppositeRatio = isLandscape ? "9:16" : "16:9";

  console.log("VeoFlow: ===== SELECT RATIO =====");
  console.log("VeoFlow: User setting value:", ratio);
  console.log("VeoFlow: isLandscape:", isLandscape);
  console.log("VeoFlow: WANT:", targetText, "(" + targetRatio + ")");
  console.log("VeoFlow: DON'T WANT:", oppositeText, "(" + oppositeRatio + ")");

  try {
    // Find ALL buttons and log them to debug
    const buttons = document.querySelectorAll('button');
    let ratioButton = null;

    // Helper to check if this is the tune/settings button (should NOT click)
    const isTuneButton = (btn) => {
      const text = (btn.textContent || "").toLowerCase();
      const iconText = btn.querySelector('i, span.material-icons, span.google-symbols')?.textContent || "";
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
      return text.includes("tune") || iconText.includes("tune") ||
             ariaLabel.includes("settings") || ariaLabel.includes("tune");
    };

    console.log("VeoFlow: Scanning", buttons.length, "buttons for ratio selector...");
    let buttonIndex = 0;
    for (const btn of buttons) {
      if (!isElementVisible(btn)) continue;
      // Skip the tune/settings button
      if (isTuneButton(btn)) continue;
      buttonIndex++;

      const btnText = btn.textContent.toLowerCase();
      const innerHTML = btn.innerHTML.toLowerCase();

      // Look for button that contains ratio-related text
      const hasLandscape = btnText.includes("landscape") || innerHTML.includes("crop_landscape");
      const hasPortrait = btnText.includes("portrait") || innerHTML.includes("crop_portrait");
      const has169 = btnText.includes("16:9");
      const has916 = btnText.includes("9:16");

      // Buttons to exclude
      const isModelButton = btnText.includes("veo") || btnText.includes("nano") || btnText.includes("imagen");
      const isOutputButton = btnText.includes("output");
      const isModeButton = btnText.includes("text to") || btnText.includes("frames to") || btnText.includes("create image");

      if ((hasLandscape || hasPortrait || has169 || has916) && !isModelButton && !isOutputButton && !isModeButton) {
        console.log("VeoFlow: Button", buttonIndex, "MATCHES ratio pattern:", btnText.substring(0, 60));
        ratioButton = btn;
        break;
      }
    }

    if (!ratioButton) {
      console.log("VeoFlow: ERROR - No ratio button found on page!");
      console.log("VeoFlow: Dumping all visible buttons for debugging:");
      let idx = 0;
      for (const btn of buttons) {
        if (!isElementVisible(btn)) continue;
        idx++;
        console.log("  Button", idx, ":", btn.textContent.substring(0, 80).replace(/\s+/g, ' '));
      }
      return true;
    }

    const currentBtnText = ratioButton.textContent.toLowerCase();
    const currentInnerHTML = ratioButton.innerHTML.toLowerCase();
    console.log("VeoFlow: Found ratio button:", currentBtnText.substring(0, 60));

    // Determine current state from button
    const btnShowsLandscape = currentBtnText.includes("landscape") || currentInnerHTML.includes("crop_landscape") || currentBtnText.includes("16:9");
    const btnShowsPortrait = currentBtnText.includes("portrait") || currentInnerHTML.includes("crop_portrait") || currentBtnText.includes("9:16");

    console.log("VeoFlow: Button shows landscape:", btnShowsLandscape);
    console.log("VeoFlow: Button shows portrait:", btnShowsPortrait);

    // Check if already showing correct ratio
    if (isLandscape && btnShowsLandscape && !btnShowsPortrait) {
      console.log("VeoFlow: Already showing LANDSCAPE - no change needed!");
      return true;
    }
    if (!isLandscape && btnShowsPortrait && !btnShowsLandscape) {
      console.log("VeoFlow: Already showing PORTRAIT - no change needed!");
      return true;
    }

    // Need to change - click to open dropdown
    console.log("VeoFlow: Current ratio is WRONG. Opening dropdown to change...");
    await clickElement(ratioButton);
    await sleep(600);

    // Find all options in dropdown
    const options = document.querySelectorAll('[role="option"]');
    console.log("VeoFlow: Found", options.length, "dropdown options");

    // Log ALL options for debugging
    console.log("VeoFlow: Listing all options:");
    for (const opt of options) {
      console.log("  Option:", opt.textContent.substring(0, 60));
    }

    // Find the option that matches our target
    for (const opt of options) {
      if (!isElementVisible(opt)) continue;

      const optText = opt.textContent.toLowerCase();
      const optHTML = opt.innerHTML.toLowerCase();

      // Check if this option matches what we want
      const optIsLandscape = optText.includes("landscape") || optHTML.includes("crop_landscape") || optText.includes("16:9");
      const optIsPortrait = optText.includes("portrait") || optHTML.includes("crop_portrait") || optText.includes("9:16");

      console.log("VeoFlow: Option check - text:", optText.substring(0, 40), "| isLandscape:", optIsLandscape, "| isPortrait:", optIsPortrait);

      // Select the option that matches our target
      if (isLandscape && optIsLandscape && !optIsPortrait) {
        console.log("VeoFlow: CLICKING LANDSCAPE option!");
        await clickElement(opt);
        await sleep(400);
        console.log("VeoFlow: Ratio changed to LANDSCAPE (16:9)");
        return true;
      }
      if (!isLandscape && optIsPortrait && !optIsLandscape) {
        console.log("VeoFlow: CLICKING PORTRAIT option!");
        await clickElement(opt);
        await sleep(400);
        console.log("VeoFlow: Ratio changed to PORTRAIT (9:16)");
        return true;
      }
    }

    // If we get here, we didn't find our target. Close dropdown.
    console.log("VeoFlow: ERROR - Could not find target ratio option!");
    document.body.click();
    await sleep(200);
    return true;
  } catch (e) {
    console.error("VeoFlow: selectRatio error:", e);
    return true;
  }
}

// Select output count - Target the "Outputs per prompt" combobox in Settings panel
async function selectOutputCount(count) {
  const target = parseInt(count) || 1;
  const targetPlain = `${target}`;

  console.log("VeoFlow: Selecting output count:", target);

  try {
    // Method 1: Find the "Outputs per prompt" combobox (button) specifically
    // This is inside the Settings panel and contains "Outputs per prompt" label
    const allButtons = Array.from(document.querySelectorAll('button[role="combobox"]'));
    const outputCombobox = allButtons.find(btn => btn.textContent.includes("Outputs per prompt"));
    
    if (outputCombobox && isElementVisible(outputCombobox)) {
      // Check if it already shows the correct value
      const currentValue = outputCombobox.textContent.match(/\d+/)?.[0];
      if (currentValue === targetPlain) {
        console.log("VeoFlow: Output count already correct:", targetPlain);
        return true;
      }

      console.log("VeoFlow: Opening 'Outputs per prompt' dropdown...");
      await clickElement(outputCombobox);
      await sleep(400);

      // Find the option with exact number match
      const options = document.querySelectorAll('[role="option"]');
      for (const opt of options) {
        const optNum = opt.textContent.trim().match(/^(\d+)$/)?.[1];
        if (optNum === targetPlain && isElementVisible(opt)) {
          console.log("VeoFlow: Clicking output option:", optNum);
          await clickElement(opt);
          await sleep(300);
          return true;
        }
      }

      // Close dropdown if no match
      document.body.click();
      console.log("VeoFlow: Could not find output option:", targetPlain);
      return true;
    }

    // Method 2: Fallback - Look for "x2" style indicator on the main bar
    const allElements = document.querySelectorAll('div, span, button');
    for (const el of allElements) {
      const text = el.textContent.trim();
      if (/^x[1-4]$/.test(text) && isElementVisible(el)) {
        if (text === `x${target}`) {
          console.log("VeoFlow: Output count (xN format) already correct:", text);
          return true;
        }

        console.log("VeoFlow: Clicking xN indicator:", text);
        await clickElement(el);
        await sleep(400);

        // Try to find option
        const options = document.querySelectorAll('[role="option"]');
        for (const opt of options) {
          const optText = opt.textContent.trim();
          if ((optText === targetPlain || optText === `x${target}`) && isElementVisible(opt)) {
            console.log("VeoFlow: Clicking output option:", optText);
            await clickElement(opt);
            await sleep(300);
            return true;
          }
        }

        document.body.click();
        return true;
      }
    }

    console.log("VeoFlow: No output count element found on page");
    return true;
  } catch (e) {
    console.error("VeoFlow: selectOutputCount error:", e);
    return true;
  }
}


// Select creation mode - Google Flow combobox with div[role="option"]
async function selectCreationMode(mode) {
  // Map extension mode values to Google Flow's exact dropdown text
  const modeText = {
    "text-to-video": "text to video",
    "frames-to-video": "frames to video",
    "create-image": "create image",
    "ingredients": "ingredients to video"
  };

  const targetText = modeText[mode];
  if (!targetText) return true;

  console.log("VeoFlow: Selecting creation mode:", targetText);

  try {
    // Find the combobox
    const combobox = document.querySelector('[role="combobox"]');
    if (!combobox) {
      console.log("VeoFlow: No combobox found on page");
      return true;
    }

    // Check if already on correct mode
    if (combobox.textContent.toLowerCase().includes(targetText)) {
      console.log("VeoFlow: Mode already correct:", targetText);
      return true;
    }

    // Open dropdown
    console.log("VeoFlow: Opening mode dropdown...");
    await clickElement(combobox);
    await sleep(400);

    // Find and click matching option (div[role="option"])
    const options = document.querySelectorAll('[role="option"]');
    for (const option of options) {
      if (option.textContent.toLowerCase().includes(targetText) && isElementVisible(option)) {
        console.log("VeoFlow: Clicking mode option:", targetText);
        await clickElement(option);
        await sleep(300);
        return true;
      }
    }

    // Close if not found
    document.body.click();
    console.log("VeoFlow: Could not find mode option:", targetText);
    return true;
  } catch (e) {
    console.error("VeoFlow: selectCreationMode error:", e);
    return true;
  }
}

// DEBUG: Log all input elements on the page
function debugLogAllInputs() {
  console.log("=== DEBUG: All input elements on page ===");

  // Check textareas
  const textareas = document.querySelectorAll("textarea");
  console.log(`Textareas found: ${textareas.length}`);
  textareas.forEach((ta, i) => {
    console.log(`Textarea ${i + 1}:`, {
      visible: ta.offsetParent !== null,
      placeholder: ta.placeholder,
      ariaLabel: ta.getAttribute("aria-label"),
      className: (ta.className || "").substring(0, 50),
      disabled: ta.disabled,
      readOnly: ta.readOnly
    });
  });

  // Check contenteditable
  const editables = document.querySelectorAll('[contenteditable="true"]');
  console.log(`Contenteditable elements found: ${editables.length}`);
  editables.forEach((el, i) => {
    console.log(`Contenteditable ${i + 1}:`, {
      visible: el.offsetParent !== null,
      tagName: el.tagName,
      className: (el.className || "").substring(0, 50),
      textContent: (el.textContent || "").substring(0, 30)
    });
  });

  // Check inputs
  const inputs = document.querySelectorAll('input[type="text"]');
  console.log(`Text inputs found: ${inputs.length}`);
  inputs.forEach((inp, i) => {
    console.log(`Input ${i + 1}:`, {
      visible: inp.offsetParent !== null,
      placeholder: inp.placeholder,
      ariaLabel: inp.getAttribute("aria-label"),
      className: (inp.className || "").substring(0, 50)
    });
  });

  console.log("=== End input debug ===");
}

// Enter prompt - use Google Flow's specific textarea ID
async function enterPrompt(prompt, clearFirst = false) {
  await sleep(500);

  // Method 1: Use Google Flow's specific textarea ID
  const textarea = document.querySelector('#PINHOLE_TEXT_AREA_ELEMENT_ID');
  if (textarea) {
    textarea.focus();
    await sleep(100);
    await typeText(textarea, prompt, 0, clearFirst);
    return true;
  }

  // Method 2: Fallback to any visible textarea
  const fallback = document.querySelector('textarea:not([disabled])');
  if (fallback) {
    fallback.focus();
    await sleep(100);
    await typeText(fallback, prompt, 0, clearFirst);
    return true;
  }

  throw new Error("Could not find prompt input");
}

// Click generate/submit button
async function clickGenerate() {
  await sleep(300);

  // IMPORTANT: Buttons to AVOID (these are NOT the generate button)
  const avoidTexts = ["expand", "edit", "settings", "more", "menu", "copy", "download", "new project", "tune"];

  // Helper to check if button should be avoided
  const shouldAvoid = (btn) => {
    const text = (btn.textContent || "").toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return avoidTexts.some(avoid => text.includes(avoid) || ariaLabel.includes(avoid));
  };

  const allButtons = Array.from(document.querySelectorAll('button:not([disabled])'));

  // Method 1: Find the button with "arrow_forward" icon AND "Create" text
  // This is the exact structure of Google Flow's create button
  for (const btn of allButtons) {
    if (shouldAvoid(btn) || !isElementVisible(btn)) continue;

    const innerHTML = btn.innerHTML || "";
    const text = (btn.textContent || "").toLowerCase();

    // The button has an <i> with arrow_forward and a <span> with "Create"
    if (innerHTML.includes("arrow_forward") && text.includes("create")) {
      console.log("VeoFlow: Found 'arrow_forward + Create' button!");
      await clickElement(btn);
      return true;
    }
  }

  // Method 2: Find button where textContent is exactly "arrow_forwardCreate" (icon + hidden text)
  for (const btn of allButtons) {
    if (shouldAvoid(btn) || !isElementVisible(btn)) continue;
    const rawText = (btn.textContent || "").trim();
    if (rawText === "arrow_forwardCreate") {
      console.log("VeoFlow: Found button with textContent 'arrow_forwardCreate'");
      await clickElement(btn);
      return true;
    }
  }

  // Method 3: Look for any button with just "Create" as text (fallback)
  for (const btn of allButtons) {
    if (shouldAvoid(btn) || !isElementVisible(btn)) continue;
    const text = (btn.textContent || "").toLowerCase().trim();
    // Only match if text is exactly "create" or "generate" (short text, primary action)
    if (text === "create" || text === "generate") {
      console.log("VeoFlow: Found button with text:", text);
      await clickElement(btn);
      return true;
    }
  }
  
  // Method 4: Fallback to arrow_forward icon button anywhere
  for (const btn of allButtons) {
    if (shouldAvoid(btn) || !isElementVisible(btn)) continue;
    const innerHTML = btn.innerHTML || "";
    if (innerHTML.includes("arrow_forward")) {
      console.log("VeoFlow: Found arrow_forward button");
      await clickElement(btn);
      return true;
    }
  }

  throw new Error("Could not find generate button (made sure to avoid Expand)");
}


// Check video generation status
function checkVideoStatus() {
  // Look for video element
  const videos = document.querySelectorAll("video");
  for (const video of videos) {
    if (video.src && video.readyState >= 2) {
      return { status: "completed", videoUrl: video.src };
    }
  }

  // Check for loading/progress indicators
  const loadingIndicators = document.querySelectorAll(
    '[role="progressbar"], [class*="loading"], [class*="spinner"], ' +
      '[class*="progress"], [aria-busy="true"], [class*="generating"]'
  );
  for (const indicator of loadingIndicators) {
    if (indicator.offsetParent !== null) {
      return { status: "processing" };
    }
  }

  // Check for "generating" or "processing" text
  const generatingText = findElementByText("generating", ["span", "div", "p"]);
  if (generatingText) {
    return { status: "processing" };
  }

  // Check for errors
  const errorElements = document.querySelectorAll(
    '[role="alert"], [class*="error"]'
  );
  for (const error of errorElements) {
    if (error.offsetParent !== null && error.textContent) {
      return { status: "error", error: error.textContent };
    }
  }

  return { status: "unknown" };
}

// Download video - finds all videos in project and downloads them
async function downloadVideo(folder) {
  console.log("Attempting to download videos...", folder);

  try {
    let downloadedCount = 0;

    // Method 1: Find all video elements and get their sources
    const videos = document.querySelectorAll("video[src], video source[src]");
    const videoUrls = new Set();

    for (const video of videos) {
      const src = video.src || video.getAttribute("src");
      if (src && src.startsWith("http")) {
        videoUrls.add(src);
      }
    }

    // Method 2: Look for download buttons/icons near each video clip
    // Google Flow typically has download icons (download_for_offline or similar)
    const downloadButtons = document.querySelectorAll(
      'button[aria-label*="download" i], button[aria-label*="save" i], ' +
      '[class*="download"], [data-tooltip*="download" i], ' +
      'button:has([class*="download"]), a[download]'
    );

    for (const btn of downloadButtons) {
      if (btn.offsetParent !== null && !btn.disabled) {
        await clickElement(btn);
        downloadedCount++;
        console.log("Clicked download button", downloadedCount);
        await sleep(1000); // Wait for download to start
      }
    }

    if (downloadedCount > 0) {
      return { success: true, count: downloadedCount };
    }

    // Method 3: Look for 3-dot menu buttons and find download option inside
    const menuButtons = document.querySelectorAll(
      'button[aria-label*="more" i], button[aria-label*="menu" i], ' +
      'button:has([class*="more_vert"]), button:has([class*="menu"])'
    );

    for (const menuBtn of menuButtons) {
      // Check if this menu is near a video element
      const container = menuBtn.closest('[class*="clip"], [class*="video"], [class*="card"]');
      if (container && container.querySelector('video')) {
        await clickElement(menuBtn);
        await sleep(500);

        // Look for download option in menu
        const downloadOption = findElementByText("download", ["button", "div", "span", "li", "a"]);
        if (downloadOption) {
          await clickElement(downloadOption);
          downloadedCount++;
          console.log("Downloaded via menu", downloadedCount);
          await sleep(1000);
        } else {
          // Close menu if no download found
          document.body.click();
          await sleep(200);
        }
      }
    }

    if (downloadedCount > 0) {
      return { success: true, count: downloadedCount };
    }

    // Method 4: Direct download from video sources (fallback)
    if (videoUrls.size > 0) {
      let index = 1;
      for (const url of videoUrls) {
        // Send to background for proper download with folder
        // Format: FolderName/video_1_timestamp.mp4
        const folderName = folder || "VeoFlow";
        const fileName = `${folderName}/video_${index}_${Date.now()}.mp4`;
        console.log("VeoFlow: Downloading to:", fileName);

        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_URL',
          data: {
            url: url,
            filename: fileName
          }
        });
        downloadedCount++;
        index++;
        await sleep(500);
      }

      console.log("Sent", downloadedCount, "videos to background for download");
      return { success: true, count: downloadedCount };
    }

    return { success: false, error: "No videos or download buttons found" };
  } catch (e) {
    console.error("Download error:", e);
    return { success: false, error: e.message };
  }
}

// Upload image for image-to-video
async function uploadImage(imageData) {
  console.log("Uploading image...");

  try {
    // Find file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let fileInput = null;

    for (const input of fileInputs) {
      const accept = input.getAttribute("accept") || "";
      if (accept.includes("image") || accept === "" || accept.includes("*")) {
        fileInput = input;
        break;
      }
    }

    if (!fileInput) {
      // Try clicking upload button first
      const uploadBtn = findButton([
        "upload",
        "add image",
        "select image",
        "choose file",
      ]);
      if (uploadBtn) {
        await clickElement(uploadBtn);
        await sleep(500);
        fileInput = document.querySelector('input[type="file"]');
      }
    }

    if (!fileInput) {
      throw new Error("File input not found");
    }

    // Create file from data URL
    const response = await fetch(imageData.url);
    const blob = await response.blob();
    const file = new File([blob], imageData.name || "image.jpg", {
      type: blob.type,
    });

    // Set file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Trigger events
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("Image uploaded");
    await sleep(1000);
    return true;
  } catch (e) {
    console.error("Image upload failed:", e);
    throw e;
  }
}

// Apply settings ONCE at the start of queue processing
// Called once before processing tasks, NOT for every task
async function applySettings(mode, settings) {
  // Guard: Prevent applying settings multiple times in the same session
  if (window.__VEOFLOW_SETTINGS_APPLIED__) {
    console.log("VeoFlow: Settings already applied in this session, skipping");
    return { success: true, skipped: true };
  }

  console.log("VeoFlow: ===== APPLYING SETTINGS (ONCE) =====");
  console.log("VeoFlow: Mode:", mode);
  console.log("VeoFlow: Settings:", JSON.stringify(settings));

  const isImageMode = mode === 'create-image';

  // Validate model for current mode
  const VALID_VIDEO_MODELS = ["veo-3.1-fast", "veo-3.1-quality", "veo-2-fast", "veo-2-quality"];
  const VALID_IMAGE_MODELS = ["imagen-4", "nano-banana", "nano-banana-pro"];

  let resolvedModel = settings.model;
  if (isImageMode && !VALID_IMAGE_MODELS.includes(resolvedModel)) {
    resolvedModel = "nano-banana-pro";
  } else if (!isImageMode && !VALID_VIDEO_MODELS.includes(resolvedModel)) {
    resolvedModel = "veo-3.1-fast";
  }

  console.log("VeoFlow: Resolved model:", resolvedModel);
  console.log("VeoFlow: Ratio from settings:", settings.ratio);
  console.log("VeoFlow: Output count from settings:", settings.outputCount);

  try {
    // 1. Select creation mode FIRST
    console.log("VeoFlow: Step 1 - Setting creation mode:", mode);
    await selectCreationMode(mode);
    await sleep(1000); // Wait for mode change to take effect

    // 2. Open the settings panel (the tune/gear icon button)
    console.log("VeoFlow: Step 2 - Opening settings panel...");
    await openSettingsIfNeeded();
    await sleep(500);

    // 3. Apply model
    console.log("VeoFlow: Step 3 - Setting model:", resolvedModel);
    await selectModel(resolvedModel, isImageMode);
    await sleep(500);

    // 4. Apply ratio - IMPORTANT: Use exact value from settings
    const ratioValue = settings.ratio || 'landscape';
    console.log("VeoFlow: Step 4 - Setting ratio:", ratioValue);
    await selectRatio(ratioValue);
    await sleep(500);

    // 5. Apply output count
    const outputValue = settings.outputCount || '1';
    console.log("VeoFlow: Step 5 - Setting output count:", outputValue);
    await selectOutputCount(outputValue);
    await sleep(300);

    // 6. Close any open dropdowns/popups by clicking outside
    console.log("VeoFlow: Step 6 - Closing all popups...");
    document.body.click();
    await sleep(300);
    // Double-click to ensure all popups are closed
    document.body.click();
    await sleep(200);

    // Mark settings as applied to prevent re-opening
    window.__VEOFLOW_SETTINGS_APPLIED__ = true;

    console.log("VeoFlow: ===== ALL SETTINGS APPLIED SUCCESSFULLY =====");
    return { success: true };
  } catch (error) {
    console.error("VeoFlow: applySettings error:", error);
    return { success: false, error: error.message };
  }
}

// Execute a single task - ONLY enters prompt and generates
// Settings are already applied once at the start
async function executeTask(task, settings) {
  console.log("VeoFlow: Executing prompt:", task.prompt?.substring(0, 40));

  try {
    // Upload image if provided (for frames-to-video mode)
    if (task.image) {
      await uploadImage(task.image);
    }

    // Enter prompt and generate
    await enterPrompt(task.prompt, true);
    await clickGenerate();

    window.__VEOFLOW_IS_AUTOMATING__ = false;
    return { success: true };
  } catch (error) {
    window.__VEOFLOW_IS_AUTOMATING__ = false;
    console.error("Task execution failed:", error);
    return { success: false, error: error.message };
  }
}

// Only register message handler ONCE
if (!window.__VEOFLOW_LISTENER__) {
  window.__VEOFLOW_LISTENER__ = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "APPLY_SETTINGS":
        // Apply settings ONCE at the start of queue
        console.log("VeoFlow: Received APPLY_SETTINGS");
        applySettings(message.data.mode, message.data.settings)
          .then(sendResponse)
          .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;

      case "EXECUTE_TASK":
        const taskId = message.data.task?.id;

        // Skip if already processed this exact task (duplicate prevention)
        if (taskId && window.__VEOFLOW_PROCESSED_TASKS__.has(taskId)) {
          console.log("VeoFlow: Skipping duplicate task", taskId);
          sendResponse({ success: true, skipped: true });
          return true;
        }

        // Mark task as processed IMMEDIATELY
        if (taskId) {
          window.__VEOFLOW_PROCESSED_TASKS__.add(taskId);
          // Clean up after 5 minutes
          setTimeout(() => window.__VEOFLOW_PROCESSED_TASKS__.delete(taskId), 300000);
        }

        // Set automating flag
        window.__VEOFLOW_IS_AUTOMATING__ = true;

        executeTask(message.data.task, message.data.settings)
          .then(sendResponse)
          .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;

      case "CHECK_VIDEO_STATUS":
        sendResponse(checkVideoStatus());
        break;

      case "DOWNLOAD_VIDEO":
        downloadVideo(message.data?.folder)
          .then(sendResponse)
          .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;

      case "CLICK_START_PROJECT":
        clickStartProject()
          .then((result) => sendResponse({ success: result }))
          .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;

      case "PING":
        sendResponse({
          success: true,
          message: "Content script active",
          url: window.location.href,
        });
        break;

      case "RESET_SETTINGS_FLAG":
        // Reset ALL settings-related flags when queue completes or stops
        window.__VEOFLOW_SETTINGS_APPLIED__ = false;
        window.__VEOFLOW_TUNE_CLICKED__ = false;
        console.log("VeoFlow: Settings flags reset - ready for next queue run");
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }
  });

  // Auto-detect page state and notify background
  function notifyReady() {
    chrome.runtime
      .sendMessage({
        type: "CONTENT_SCRIPT_READY",
        data: { url: window.location.href },
      })
      .catch(() => {});
  }

  // Wait for page to fully load then notify
  if (document.readyState === "complete") {
    notifyReady();
  } else {
    window.addEventListener("load", notifyReady);
  }

  console.log("VeoFlow content script initialized");
} else {
  console.log("VeoFlow: Message listener already registered, skipping duplicate");
}
