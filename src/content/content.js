/**
 * VeoFlow Content Script
 * Runs on Google Flow pages to automate video generation
 * Targets: labs.google/fx/tools/video-fx, labs.google/fx/tools/flow
 *
 * NOTE: This script is ONLY loaded via programmatic injection from background.js
 * (removed from manifest.json to prevent duplicate execution)
 */

console.log("VeoFlow content script loaded on:", window.location.href);

// State tracking
let isAutomating = false;

// Helper: Sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Wait for element with multiple selectors
async function waitForElement(selectors, timeout = 15000) {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      for (const selector of selectorList) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el && el.offsetParent !== null && !el.disabled) {
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

  for (const tag of tagNames) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      const elText = (el.textContent || "").toLowerCase().trim();
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

      if (
        (elText.includes(searchText) || ariaLabel.includes(searchText)) &&
        el.offsetParent !== null
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

// Helper: Human-like click
async function clickElement(element) {
  if (!element) {
    throw new Error("Cannot click null element");
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(200);

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Simulate mouse events
  element.dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true, clientX: x, clientY: y })
  );
  await sleep(50);
  element.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, clientX: x, clientY: y })
  );
  await sleep(30);
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y })
  );
  element.click();
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, clientX: x, clientY: y })
  );

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

// Step 1: Click "Start project" or "Create new" button
// IMPORTANT: Avoid clicking Edit, Save, Settings, or other unrelated buttons
async function clickStartProject() {
  console.log("Looking for start/create button...");

  // Wait a bit for page to fully load
  await sleep(500);

  // Buttons to AVOID (not the new project button)
  const avoidTexts = ["edit", "save", "settings", "delete", "cancel", "close", "menu", "more", "expand"];
  const shouldAvoid = (btn) => {
    const text = (btn.textContent || "").toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return avoidTexts.some(avoid => text.includes(avoid) || ariaLabel.includes(avoid));
  };

  // 1. Look specifically for "New project" button with add icon
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    if (btn.offsetParent === null || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const text = (btn.textContent || "").toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();

    // Must explicitly contain "new project"
    if (text.includes("new project") || ariaLabel.includes("new project")) {
      await clickElement(btn);
      console.log("Clicked 'New project' button");
      await sleep(1500);
      return true;
    }
  }

  // 2. Look for button with add icon AND project-related text
  for (const btn of allButtons) {
    if (btn.offsetParent === null || btn.disabled) continue;
    if (shouldAvoid(btn)) continue;

    const text = (btn.textContent || "").toLowerCase();
    const innerHTML = btn.innerHTML || "";

    // Has add icon (add_2 is Google's icon name) and contains "project" or "new"
    if ((innerHTML.includes("add_2") || innerHTML.includes("add_circle")) &&
        (text.includes("project") || text.includes("new"))) {
      await clickElement(btn);
      console.log("Clicked button with add icon + project text");
      await sleep(1500);
      return true;
    }
  }

  // 3. Fallback: Look for FAB (floating action button) with + icon for creating
  const fabButtons = document.querySelectorAll(
    'button[aria-label*="new project" i], button[aria-label*="create project" i]'
  );
  for (const fab of fabButtons) {
    if (fab.offsetParent !== null && !fab.disabled && !shouldAvoid(fab)) {
      await clickElement(fab);
      console.log("Clicked FAB new project button");
      await sleep(1500);
      return true;
    }
  }

  console.log("No start button found - may already be in create mode");
  return false;
}

// Step 2: Select model from dropdown
// Google Flow has "Model" dropdown with options like "Veo 3.1 - Fast", "Veo 3.1 - Quality", etc.
async function selectModel(modelValue) {
  console.log("Selecting model:", modelValue);

  const modelMap = {
    "veo-3.1-fast": ["veo 3.1 - fast", "3.1 - fast", "fast"],
    "veo-3.1-quality": ["veo 3.1 - quality", "3.1 - quality", "quality"],
    "veo-3.1-low-priority": ["veo 3.1 - low", "low priority", "low-priority"],
    "veo-2.0": ["veo 2.0", "veo 2", "2.0"],
  };

  const searchTerms = modelMap[modelValue] || ["fast"];

  try {
    // Method 1: Find "Model" dropdown by looking for nearby label text
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const text = (el.textContent || "").toLowerCase();

      // Look for element with "Model" label (but not "Model" inside option text)
      if (text.includes("model") && el.children.length < 10) {
        const dropdown = el.querySelector('button, [role="combobox"], [aria-haspopup]') ||
                        el.closest('[role="combobox"]') ||
                        el.parentElement?.querySelector('button[aria-haspopup], [role="combobox"]');

        if (dropdown && dropdown.offsetParent !== null) {
          // Check if this dropdown contains "veo" (model dropdown)
          const dropdownText = (dropdown.textContent || "").toLowerCase();
          if (dropdownText.includes("veo") || dropdownText.includes("model")) {
            await clickElement(dropdown);
            await sleep(500);

            // Look for option matching our model
            const options = document.querySelectorAll(
              '[role="option"], [role="menuitem"], li, [class*="option"]'
            );

            for (const option of options) {
              const optionText = (option.textContent || "").toLowerCase();
              for (const term of searchTerms) {
                if (optionText.includes(term.toLowerCase())) {
                  await clickElement(option);
                  console.log("Selected model:", optionText);
                  await sleep(300);
                  return true;
                }
              }
            }

            // Close dropdown if opened but no match
            document.body.click();
            await sleep(200);
          }
        }
      }
    }

    // Method 2: Find dropdown showing "Veo" in its text (model dropdown)
    const dropdowns = document.querySelectorAll(
      'button[aria-haspopup], [role="combobox"], [role="listbox"]'
    );

    for (const dropdown of dropdowns) {
      const text = (dropdown.textContent || "").toLowerCase();

      if (text.includes("veo")) {
        await clickElement(dropdown);
        await sleep(500);

        const options = document.querySelectorAll(
          '[role="option"], [role="menuitem"], li, [class*="option"]'
        );

        for (const option of options) {
          const optionText = (option.textContent || "").toLowerCase();
          for (const term of searchTerms) {
            if (optionText.includes(term.toLowerCase())) {
              await clickElement(option);
              console.log("Selected model from Veo dropdown:", optionText);
              await sleep(300);
              return true;
            }
          }
        }

        document.body.click();
        await sleep(200);
      }
    }

    console.log("Model selector not found - Flow may use default");
    return false;
  } catch (e) {
    console.warn("Model selection failed:", e);
    return false;
  }
}

// Step 3: Select aspect ratio
// Google Flow has "Aspect Ratio" dropdown with "Landscape (16:9)" and "Portrait (9:16)"
async function selectRatio(ratio) {
  console.log("Selecting ratio:", ratio);

  const isLandscape = ratio === "landscape";
  const searchTerms = isLandscape
    ? ["landscape (16:9)", "landscape", "16:9"]
    : ["portrait (9:16)", "portrait", "9:16"];

  try {
    // Method 1: Find "Aspect Ratio" dropdown by looking for nearby label text
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const text = (el.textContent || "").toLowerCase();

      // Look for element with "Aspect Ratio" label
      if (text.includes("aspect ratio")) {
        const dropdown = el.querySelector('button, [role="combobox"], [aria-haspopup]') ||
                        el.closest('[role="combobox"]') ||
                        el.parentElement?.querySelector('button[aria-haspopup], [role="combobox"]');

        if (dropdown && dropdown.offsetParent !== null) {
          const dropdownText = (dropdown.textContent || "").toLowerCase();
          // Make sure this is the aspect ratio dropdown (contains landscape/portrait or 16:9/9:16)
          if (dropdownText.includes("landscape") || dropdownText.includes("portrait") ||
              dropdownText.includes("16:9") || dropdownText.includes("9:16")) {
            await clickElement(dropdown);
            await sleep(500);

            // Look for option matching our ratio
            const options = document.querySelectorAll(
              '[role="option"], [role="menuitem"], li, [class*="option"]'
            );

            for (const option of options) {
              const optionText = (option.textContent || "").toLowerCase();
              for (const term of searchTerms) {
                if (optionText.includes(term.toLowerCase())) {
                  await clickElement(option);
                  console.log("Selected aspect ratio:", optionText);
                  await sleep(300);
                  return true;
                }
              }
            }

            // Close dropdown if opened but no match
            document.body.click();
            await sleep(200);
          }
        }
      }
    }

    // Method 2: Find dropdown showing "Landscape" or "Portrait" in its text
    const dropdowns = document.querySelectorAll(
      'button[aria-haspopup], [role="combobox"], [role="listbox"]'
    );

    for (const dropdown of dropdowns) {
      const text = (dropdown.textContent || "").toLowerCase();

      if (text.includes("landscape") || text.includes("portrait") ||
          text.includes("16:9") || text.includes("9:16")) {
        await clickElement(dropdown);
        await sleep(500);

        const options = document.querySelectorAll(
          '[role="option"], [role="menuitem"], li, [class*="option"]'
        );

        for (const option of options) {
          const optionText = (option.textContent || "").toLowerCase();
          for (const term of searchTerms) {
            if (optionText.includes(term.toLowerCase())) {
              await clickElement(option);
              console.log("Selected aspect ratio from dropdown:", optionText);
              await sleep(300);
              return true;
            }
          }
        }

        document.body.click();
        await sleep(200);
      }
    }

    console.log("Aspect ratio selector not found - Flow may use default");
    return false;
  } catch (e) {
    console.warn("Aspect ratio selection failed:", e);
    return false;
  }
}

// Step 4: Select output count (1-4 videos per prompt) - CRITICAL to avoid token burn!
// Google Flow has "Outputs per prompt" dropdown with values 1, 2, 3, 4
async function selectOutputCount(count) {
  const targetCount = parseInt(count) || 1;
  console.log("Selecting output count:", targetCount);

  try {
    // Method 1: Find "Outputs per prompt" dropdown by looking for nearby label text
    // Google Flow structure: container with "Outputs per prompt" label and dropdown
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const text = (el.textContent || "").toLowerCase();

      // Look for element containing "outputs per prompt" label
      if (text.includes("outputs per prompt") || text.includes("output per prompt")) {
        // Find clickable dropdown within or near this element
        const dropdown = el.querySelector('button, [role="combobox"], [role="listbox"], [aria-haspopup]') ||
                        el.closest('[role="combobox"]') ||
                        el.parentElement?.querySelector('button, [role="combobox"], [aria-haspopup]');

        if (dropdown && dropdown.offsetParent !== null) {
          await clickElement(dropdown);
          await sleep(500);

          // Look for option matching target count
          const options = document.querySelectorAll(
            '[role="option"], [role="menuitem"], [role="listitem"], li, [class*="option"], [class*="menu-item"]'
          );

          for (const option of options) {
            const optText = (option.textContent || "").trim();
            if (optText === String(targetCount)) {
              await clickElement(option);
              console.log("Selected output count from 'Outputs per prompt' dropdown:", targetCount);
              await sleep(300);
              return true;
            }
          }
        }
      }
    }

    // Method 2: Look for any dropdown currently showing a number (1-4) that could be output count
    const dropdowns = document.querySelectorAll(
      'button[aria-haspopup], [role="combobox"], [role="listbox"]'
    );

    for (const dropdown of dropdowns) {
      const text = (dropdown.textContent || "").trim();
      const ariaLabel = (dropdown.getAttribute("aria-label") || "").toLowerCase();

      // Check if this dropdown shows a number 1-4 (likely output count)
      // and has related label nearby
      const parent = dropdown.closest('div, section, fieldset');
      const parentText = (parent?.textContent || "").toLowerCase();

      if (
        (parentText.includes("output") || parentText.includes("per prompt") || ariaLabel.includes("output")) &&
        /^[1-4]$/.test(text)
      ) {
        await clickElement(dropdown);
        await sleep(500);

        // Look for option matching target count
        const options = document.querySelectorAll(
          '[role="option"], [role="menuitem"], li, [class*="option"]'
        );

        for (const option of options) {
          const optText = (option.textContent || "").trim();
          if (optText === String(targetCount)) {
            await clickElement(option);
            console.log("Selected output count:", targetCount);
            await sleep(300);
            return true;
          }
        }

        // Close dropdown if we opened it but didn't find option
        document.body.click();
        await sleep(200);
      }
    }

    // Method 3: Direct click on visible number options (if Flow shows 1,2,3,4 as buttons)
    const numberButtons = document.querySelectorAll('button, [role="radio"], [role="tab"]');
    for (const btn of numberButtons) {
      const text = (btn.textContent || "").trim();
      const parent = btn.closest('div, section');
      const parentText = (parent?.textContent || "").toLowerCase();

      if (
        text === String(targetCount) &&
        (parentText.includes("output") || parentText.includes("per prompt"))
      ) {
        if (btn.offsetParent !== null && !btn.disabled) {
          await clickElement(btn);
          console.log("Selected output count button:", targetCount);
          await sleep(300);
          return true;
        }
      }
    }

    console.log("Output count selector not found - Flow may already be set to", targetCount);
    return false;
  } catch (e) {
    console.warn("Output count selection failed:", e);
    return false;
  }
}

// Step 5: Enter prompt text
async function enterPrompt(prompt, clearFirst = false) {
  console.log("Entering prompt...", clearFirst ? "(clearing first)" : "");

  // Find the prompt input area
  const inputSelectors = [
    'textarea[placeholder*="prompt" i]',
    'textarea[placeholder*="describe" i]',
    'textarea[aria-label*="prompt" i]',
    "textarea",
    '[contenteditable="true"]',
    'input[type="text"][placeholder*="prompt" i]',
    '[data-testid*="prompt"]',
    '[class*="prompt"] textarea',
    '[class*="input"] textarea',
  ];

  for (const selector of inputSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (el.offsetParent !== null) {
        // Check if this looks like a prompt input
        const placeholder = (
          el.getAttribute("placeholder") || ""
        ).toLowerCase();
        const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
        const className = (el.className || "").toLowerCase();

        const isPromptInput =
          el.tagName === "TEXTAREA" ||
          placeholder.includes("prompt") ||
          placeholder.includes("describe") ||
          ariaLabel.includes("prompt") ||
          className.includes("prompt");

        if (isPromptInput || el.tagName === "TEXTAREA") {
          await typeText(el, prompt, 0, clearFirst); // Paste full text at once (delay not used)
          console.log("Prompt pasted successfully");
          return true;
        }
      }
    }
  }

  // Fallback: find any visible textarea
  const allTextareas = document.querySelectorAll("textarea");
  for (const ta of allTextareas) {
    if (ta.offsetParent !== null && !ta.disabled && !ta.readOnly) {
      await typeText(ta, prompt, 0, clearFirst); // Paste full text at once
      console.log("Prompt pasted (fallback)");
      return true;
    }
  }

  throw new Error("Could not find prompt input field");
}

// Step 6: Click generate/submit button (the arrow → button, NOT the Expand button)
async function clickGenerate() {
  console.log("Looking for generate button (avoiding Expand)...");

  // Wait a moment for button to become enabled
  await sleep(500);

  // IMPORTANT: Buttons to AVOID (these are NOT the generate button)
  const avoidTexts = ["expand", "edit", "settings", "more", "menu", "copy", "download"];

  // Helper to check if button should be avoided
  const shouldAvoid = (btn) => {
    const text = (btn.textContent || "").toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return avoidTexts.some(avoid => text.includes(avoid) || ariaLabel.includes(avoid));
  };

  // Method 1: Find the submit arrow button (→) in the prompt input area
  // In Google Flow, this is typically a circular button with an arrow icon near the prompt textarea
  const promptArea = document.querySelector('[class*="prompt"], [class*="input"], [class*="composer"]');
  if (promptArea) {
    const buttonsInPromptArea = promptArea.querySelectorAll('button:not([disabled])');
    for (const btn of buttonsInPromptArea) {
      if (shouldAvoid(btn)) continue;

      // Look for arrow icon button (submit button)
      const innerHTML = btn.innerHTML || "";
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();

      // Arrow icons often have SVG with arrow path or specific aria-labels
      if (
        innerHTML.includes("arrow") ||
        innerHTML.includes("→") ||
        innerHTML.includes("send") ||
        ariaLabel.includes("submit") ||
        ariaLabel.includes("send") ||
        ariaLabel.includes("generate") ||
        btn.querySelector('svg[class*="arrow"], svg[class*="send"]')
      ) {
        await clickElement(btn);
        console.log("Clicked submit arrow button in prompt area");
        return true;
      }
    }

    // Fallback: Look for the last button in prompt area (often the submit button)
    const visibleButtons = Array.from(buttonsInPromptArea).filter(btn =>
      btn.offsetParent !== null && !shouldAvoid(btn)
    );
    if (visibleButtons.length > 0) {
      const lastButton = visibleButtons[visibleButtons.length - 1];
      await clickElement(lastButton);
      console.log("Clicked last button in prompt area (likely submit)");
      return true;
    }
  }

  // Method 2: Find button with arrow/submit characteristics anywhere on page
  const allButtons = document.querySelectorAll('button:not([disabled])');
  for (const btn of allButtons) {
    if (shouldAvoid(btn)) continue;
    if (btn.offsetParent === null) continue;

    const text = (btn.textContent || "").toLowerCase().trim();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    const innerHTML = btn.innerHTML || "";

    // Priority 1: Arrow/send buttons
    if (
      ariaLabel.includes("submit") ||
      ariaLabel.includes("send") ||
      ariaLabel.includes("generate") ||
      innerHTML.includes("arrow_forward") ||
      innerHTML.includes("send")
    ) {
      await clickElement(btn);
      console.log("Clicked arrow/send button");
      return true;
    }

    // Priority 2: Generate/Create buttons (but NOT Expand/Edit)
    if (
      (text === "generate" || text === "create" || text === "submit") &&
      !shouldAvoid(btn)
    ) {
      await clickElement(btn);
      console.log("Clicked generate button:", text);
      return true;
    }
  }

  // Method 3: Look for circular button (FAB style) which is often the submit
  const circularButtons = document.querySelectorAll('button[class*="fab"], button[class*="round"], button[class*="circle"]');
  for (const btn of circularButtons) {
    if (btn.offsetParent !== null && !btn.disabled && !shouldAvoid(btn)) {
      await clickElement(btn);
      console.log("Clicked circular FAB button");
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
        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_URL',
          data: {
            url: url,
            filename: `${folder || "VeoFlow"}/${folder || "video"}_${index}_${Date.now()}.mp4`
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

// Main task execution
async function executeTask(task, settings) {
  if (isAutomating) {
    return { success: false, error: "Already automating" };
  }

  isAutomating = true;
  console.log("Executing task:", task.prompt?.substring(0, 50));

  try {
    // Step 1: Select model (we don't click start project here - it's done once at queue start)
    if (settings.model) {
      await selectModel(settings.model);
      await sleep(500);
    }

    // Step 2: Select ratio (16:9 or 9:16)
    if (settings.ratio) {
      await selectRatio(settings.ratio);
      await sleep(500);
    }

    // Step 3: Select output count (1-4 videos) - CRITICAL to avoid token burn!
    // This ensures only 1 video per prompt when user selects "1" in settings
    const outputCount = settings.videosPerTask || '1';
    await selectOutputCount(outputCount);
    await sleep(300);

    // Step 4: Handle image-to-video
    if (task.type === "image-to-video" && task.image) {
      await uploadImage(task.image);
      await sleep(1000);
    }

    // Step 5: Enter prompt (pastes full prompt INSTANTLY - no character animation)
    if (task.prompt) {
      // Clear any existing prompt first (for bulk videos in same project)
      await enterPrompt(task.prompt, true); // Pass true to clear first
      await sleep(300);
    }

    // Step 6: Click generate
    await clickGenerate();

    isAutomating = false;
    return { success: true };
  } catch (error) {
    isAutomating = false;
    console.error("Task execution failed:", error);
    return { success: false, error: error.message };
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message.type);

  switch (message.type) {
    case "EXECUTE_TASK":
      executeTask(message.data.task, message.data.settings)
        .then(sendResponse)
        .catch((e) => sendResponse({ success: false, error: e.message }));
      return true; // Keep channel open for async

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
