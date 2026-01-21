# Google Flow UI Elements Inspection Results

## 1. Prompt Area

**Selector:** `textarea#PINHOLE_TEXT_AREA_ELEMENT_ID`

```html
<textarea
  id="PINHOLE_TEXT_AREA_ELEMENT_ID"
  placeholder="Generate a video with text…"
  class="sc-e586993-0 gEBbLp"
></textarea>
```

## 2. Mode Switcher

**Selector:** `button[role="combobox"]`

```html
<button
  type="button"
  role="combobox"
  data-state="open"
  class="sc-c177465c-1 hVamcH sc-bd77098e-1 ccMsiG sc-fbe1c021-0 hKBFUo"
>
  <span>Text to Video</span>
  <div class="sc-bd77098e-3 lkbHsl">
    <i class="sc-95c4f607-0 grsLJu material-icons sc-bd77098e-4 dTYaww"
      >close</i
    >
  </div>
</button>
```

## 3. Creation Modes (Options)

Found 4 modes in the dropdown:

- Text to Video
- Frames to Video
- Ingredients to Video
- Create Image

```html
<div role="option" ...><span>Text to Video</span></div>
<div role="option" ...><span>Frames to Video</span></div>
<div role="option" ...><span>Ingredients to Video</span></div>
<div role="option" ...><span>Create Image</span></div>
```

## 4. Settings Controls

**Model Selector:**

```html
<button ...>Veo 3.1 - Fast</button>
```

**Aspect Ratio Selector:**

```html
<button ...>Landscape (16:9)</button>
```

**Outputs / Duration:**

```html
<div class="sc-fd871d0e-6 iVTznu">x2</div>
```

**Advanced Settings Panel Container:**

```html
<div role="dialog" class="sc-3d54f340-2 eUbAIN PopoverContent">...</div>
```

## 5. Detailed Settings Options (Captured)

### Video Mode Options

**Model Options:**

```html
<div role="option" ...>
  <span id="radix-:r3u:">Veo 3.1 - Fast</span>
  <div ...>Beta Audio</div>
</div>
<div role="option" ...>
  <span id="radix-:r3v:">Veo 3.1 - Quality</span>
  <div ...>Beta Audio</div>
</div>
<div role="option" ...>
  <span id="radix-:r40:">Veo 2 - Fast</span>
  <div ...>No Audio</div>
</div>
<div role="option" ...>
  <span id="radix-:r41:">Veo 2 - Quality</span>
  <div ...>No Audio</div>
</div>
```

**Aspect Ratio Options:**

```html
<div role="option" ...>
  <i ...>crop_landscape</i><span ...>Landscape (16:9)</span>
</div>
<div role="option" ...>
  <i ...>crop_portrait</i><span ...>Portrait (9:16)</span>
</div>
```

### Create Image Mode Options

**Model Options:**

```html
<div role="option" ...><span ...>Imagen 4</span></div>
<div role="option" ...><span ...>🍌 Nano Banana</span></div>
<div role="option" ...><span ...>🍌 Nano Banana Pro</span></div>
```

**Aspect Ratio Options:**

```html
<div role="option" ...>
  <i ...>crop_landscape</i><span ...>Landscape (16:9)</span>
</div>
<div role="option" ...>
  <i ...>crop_portrait</i><span ...>Portrait (9:16)</span>
</div>
```

## 6. Add Reference Image / Ingredients Button

**Location:** Bottom-left of the prompt input area (visible in "Ingredients to Video" and "Create Image" modes)

**Selector:** Button containing `<i class="google-symbols">add</i>`

```html
<button class="sc-c177465c-1 hVamcH sc-d02e9a37-1 hvUQuN">
  <i
    class="sc-95c4f607-0 ojlmB google-symbols sc-d02e9a37-7 fJfKrq"
    font-size="1.5rem"
    color="currentColor"
    >add</i
  >
  <div data-type="button-overlay" class="sc-c177465c-0 hWqLBn"></div>
</button>
```

**JavaScript Selector:**

```javascript
// Find the "+" button for adding reference images
const addButton = Array.from(document.querySelectorAll("button")).find(
  (b) => b.querySelector("i")?.textContent === "add",
);
```
