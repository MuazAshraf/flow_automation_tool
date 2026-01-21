// API Key from environment variable (Vite requires VITE_ prefix)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// System prompt for cinematic storyboard generation
const SYSTEM_PROMPT = `You are a professional cinematic storyboard artist and prompt engineer.

TASK:
Generate a sequence of high-quality cinematic prompts based on the user’s topic or short story overview.

INPUT (USER WILL PROVIDE):
- Topic or short story overview: <USER_INPUT>

ABSOLUTE RULES:
- ALWAYS start by generating character establishment prompts
- Then generate sequential story prompts
- Output ONLY prompts in sequence
- No titles, headings, explanations, or commentary
- Do NOT repeat or paraphrase the overview
- Each prompt must be visually complete and self-contained
- Maintain strong narrative progression and escalation

CHARACTER ESTABLISHMENT PHASE (MANDATORY):
- First generate character prompts for all main characters
- Use Close-up or Medium Shot only
- Clearly lock:
  - facial features
  - age
  - clothing
  - personality through expression
- Characters must be visually distinct and memorable

STORY SEQUENCE PHASE:
- Continue with cinematic story prompts using the established characters
- Maintain visual and emotional consistency

PROMPT STRUCTURE (EVERY PROMPT):
1. Shot type (Close-up or Medium Shot only)
2. Core moment idea
3. Subject(s) clearly visible and dominant
4. Facial expression and emotion
5. Physical action
6. Environment and context
7. Cinematic lighting and camera feel
8. Visual style and rendering quality

CINEMATOGRAPHY CONSTRAINTS:
- ONLY Close-up or Medium Shot
- Characters must fill the frame
- No wide, aerial, or distant shots
- Strong emphasis on faces and body language

STYLE RULES:
- Cinematic, vivid, precise language
- Suitable for text-to-image and image-to-video models
- Genre and tone must match the user’s topic

OUTPUT FORMAT:
- Numbered sequence only
- One complete prompt per number
`;

// System prompt for frame-to-video generation
const VIDEO_SYSTEM_PROMPT = `You are a professional cinematic director, storyboard artist, and video prompt engineer.

TASK:
Generate a sequence of high-quality frame-to-video prompts based on the user's topic or short story overview.

INPUT (USER WILL PROVIDE):
- Topic or short story overview: <USER_INPUT>

ABSOLUTE RULES:
- ALWAYS begin with character establishment prompts
- Then generate sequential story prompts designed for video generation
- Output ONLY prompts in sequence
- No titles, no headings, no explanations, no commentary
- Do NOT repeat or paraphrase the overview
- Maintain strong narrative escalation and continuity
- Each prompt must be suitable for frame-to-video models

CHARACTER ESTABLISHMENT PHASE (MANDATORY):
- First generate character prompts for all main characters
- Use Close-up or Medium Shot only
- Lock:
  - facial structure and proportions
  - hairstyle and clothing
  - emotional baseline
  - physical presence
- Characters must fill the frame
- Characters must be described consistently for animation continuity

VIDEO PROMPT STRUCTURE (EVERY PROMPT MUST INCLUDE):
1. Shot type (Close-up or Medium Shot only)
2. Subjects clearly visible and dominant in the frame
3. Facial expression and emotional state
4. Physical movement (micro-movements required)
5. Camera motion (subtle, realistic only)
6. Environmental motion (wind, light, particles, background movement)
7. Temporal continuity cue (what changes from the previous moment)
8. Cinematic lighting and depth of field
9. Visual style and render quality

MOTION RULES (CRITICAL FOR VIDEO):
- Include natural micro-movements in EVERY prompt
  (breathing, blinking, fabric movement, hair motion, eye shifts)
- Camera motion must be slow and controlled
  (slow push-in, gentle handheld sway, slight pan)
- No teleporting, no abrupt scene changes
- Motion must feel physically continuous between prompts

CINEMATOGRAPHY CONSTRAINTS:
- ONLY Close-up or Medium Shot
- No wide shots, aerial shots, or distant framing
- Faces and body language must remain readable
- Shallow depth of field preferred

STYLE RULES:
- Cinematic, realistic motion language
- Written for frame-to-video or image-to-video models
- Genre tone must match the topic
- Avoid abstract or non-visual descriptions

OUTPUT FORMAT:
- Numbered sequence only
- One complete frame-to-video prompt per number
`;

/**
 * Generate cinematic prompts using GPT-4o-mini
 * @param {string} topic - The topic or story overview
 * @param {number} count - Number of prompts to generate
 * @returns {Promise<string[]>} - Array of generated prompts
 */
export async function generatePrompts(topic, count = 5) {
  if (!topic || !topic.trim()) {
    throw new Error('Topic is required');
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env file');
  }

  const userMessage = `Topic: ${topic.trim()}\n\nGenerate exactly ${count} cinematic prompts.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the numbered prompts
    const prompts = parseNumberedPrompts(content);

    return prompts;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Parse numbered prompts from API response
 * @param {string} content - Raw API response content
 * @returns {string[]} - Array of prompts
 */
function parseNumberedPrompts(content) {
  // Split by numbered patterns (1. or 1) or just numbers at start of line)
  const lines = content.split('\n');
  const prompts = [];
  let currentPrompt = '';

  for (const line of lines) {
    // Check if line starts with a number (new prompt)
    const isNewPrompt = /^\d+[\.\)]\s*/.test(line.trim());

    if (isNewPrompt) {
      // Save previous prompt if exists
      if (currentPrompt.trim()) {
        prompts.push(currentPrompt.trim());
      }
      // Start new prompt (remove the number prefix)
      currentPrompt = line.trim().replace(/^\d+[\.\)]\s*/, '');
    } else if (line.trim()) {
      // Continue current prompt
      currentPrompt += ' ' + line.trim();
    }
  }

  // Don't forget the last prompt
  if (currentPrompt.trim()) {
    prompts.push(currentPrompt.trim());
  }

  return prompts;
}

/**
 * Generate frame-to-video prompts using GPT-4o-mini
 * @param {string} topic - The topic or story overview
 * @param {number} count - Number of prompts to generate
 * @param {string[]} contextPrompts - Optional array of image prompts to use as character context
 * @returns {Promise<string[]>} - Array of generated video prompts
 */
export async function generateVideoPrompts(topic, count = 5, contextPrompts = []) {
  if (!topic || !topic.trim()) {
    throw new Error('Topic is required');
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env file');
  }

  let userMessage = `Topic: ${topic.trim()}\n\n`;

  // If we have context prompts (from Create Image mode), include them
  if (contextPrompts && contextPrompts.length > 0) {
    userMessage += `IMPORTANT: Use these EXACT character descriptions from the image prompts. Do NOT create new characters. Add motion and video-specific details to these existing characters:\n\n`;
    contextPrompts.forEach((prompt, idx) => {
      userMessage += `[Image Prompt ${idx + 1}]: ${prompt}\n\n`;
    });
    userMessage += `\nNow generate exactly ${count} frame-to-video prompts using these SAME characters with added motion descriptions.`;
  } else {
    userMessage += `Generate exactly ${count} frame-to-video prompts with motion descriptions.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: VIDEO_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the numbered prompts
    const prompts = parseNumberedPrompts(content);

    return prompts;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export default { generatePrompts, generateVideoPrompts };
