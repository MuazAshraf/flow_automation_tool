# VeoFlow - Bulk Video Generator for Google Flow

A Chrome extension for automating bulk video and image generation on Google Flow (labs.google/fx).

## Features

- **Bulk Generation**: Queue multiple prompts and generate videos/images automatically
- **Multiple Modes**: Support for Text to Video, Frames to Video, Create Image, and Ingredients to Video
- **Auto-Download**: Automatically download generated videos to a custom folder
- **Queue Management**: Add, remove, and track prompts in a queue
- **Progress Tracking**: Real-time progress updates and logging

## Installation

### Step 1: Build the Extension

```bash
# Clone or download the project
cd veo-flow-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select the `dist` folder from the project directory

### Step 3: Pin the Extension

1. Click the puzzle icon in Chrome toolbar
2. Find **VeoFlow** and click the pin icon to keep it visible

## Usage

### Getting Started

1. Click the VeoFlow extension icon to open the sidebar
2. Navigate to [Google Flow](https://labs.google/fx/tools/flow) in your browser
3. The extension will show "Connected to Google Flow" when ready

### Adding Prompts

1. In the **Control** tab, enter your prompts in the text area
2. Separate multiple prompts with a blank line:
   ```
   First video prompt here.
   Can span multiple lines.

   Second video prompt starts after blank line.

   Third prompt...
   ```
3. Or click **Import .txt** to load prompts from a text file
4. Click **Add to Queue** to add prompts

### Configuring Settings

Go to the **Settings** tab to configure:

- **Creation Mode**: Text to Video, Frames to Video, Create Image, or Ingredients
- **Model**:
  - Video: Veo 3.1 Fast/Quality, Veo 2 Fast/Quality
  - Image: Imagen 4, Nano Banana, Nano Banana Pro
- **Aspect Ratio**: 16:9 (Landscape) or 9:16 (Portrait)
- **Outputs per prompt**: 1-4 videos/images per prompt
- **Auto-download**: Enable to automatically download generated content
- **Download folder**: Custom folder name (created in your Downloads directory)

### Running the Queue

1. Make sure you're on Google Flow page
2. Click **Start Queue** to begin processing
3. The extension will:
   - Click "New Project"
   - Apply your settings (model, ratio, output count)
   - Enter each prompt and click Generate
   - Wait for completion and download (if enabled)
4. Click **Stop** to pause processing at any time

### Frames to Video Mode

1. Select "Frames to Video" in Settings
2. In Control tab, click **Select images** to choose source images
3. Add corresponding prompts (one per image)
4. Start the queue

### History Tab

- View logs of all actions
- See failed tasks and errors
- Clear logs when needed

## Default Settings

- Mode: Text to Video
- Model: Veo 3.1 - Fast (20 credits)
- Aspect Ratio: 16:9 (Landscape)
- Outputs: 1 per prompt

## Folder Structure

```
veo-flow-extension/
├── src/
│   ├── App.jsx              # Main application
│   ├── components/          # React components
│   │   ├── ControlTab.jsx   # Queue management UI
│   │   ├── SettingsTab.jsx  # Settings UI
│   │   ├── HistoryTab.jsx   # Logs and history
│   │   └── ...
│   ├── content/
│   │   └── content.js       # Content script (interacts with Google Flow)
│   └── background/
│       └── background.js    # Service worker (queue processing)
├── public/
│   └── manifest.json        # Chrome extension manifest
└── dist/                    # Built extension (load this in Chrome)
```

## Troubleshooting

### Extension not connecting to Google Flow
- Make sure you're on `labs.google/fx` or `labs.google/flow`
- Refresh the page and reopen the extension

### Settings not applying correctly
- Ensure you're on the Google Flow page before starting
- Try refreshing Google Flow and starting again

### Videos not downloading
- Check that auto-download is enabled in Settings
- Verify the download folder name is valid
- Check Chrome's download settings

## Tech Stack

- React + Vite
- Tailwind CSS
- Chrome Extension Manifest V3

## License

MIT
