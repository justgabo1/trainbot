import OpenAI from 'openai'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const CONSISTENCY_REMINDER = `

CONSISTENCY RULES — read before every reply:
1. Re-read your character description above.
2. If the agent has NOT met your de-escalation criteria, do NOT soften.
3. Keep replies 2–4 sentences max — real chat messages are short.
4. You are the CUSTOMER. Never be helpful. Never apologise unless de-escalated.
5. Maintain your emotional state exactly as defined — do not drift toward helpfulness.`

const RESPONSE_FORMAT = `

RESPONSE FORMAT:
- Maximum 3 sentences per reply. Never write paragraphs.
- Never use bullet points or lists.
- Never start with "I understand" — show understanding through action.
- If the agent is vague, push back specifically on the vagueness.`

export async function getChatResponse(
  persona: { systemPrompt: string; name: string; tone: string; intent: string; difficulty: string },
  history: { role: 'user' | 'assistant'; content: string }[]
) {
  const systemPrompt = `${persona.systemPrompt}${CONSISTENCY_REMINDER}${RESPONSE_FORMAT}`

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 300,
    temperature: 0.85,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
    ],
  })

  return response.choices[0].message.content ?? 'Sorry, something went wrong.'
}

export async function scoreTranscript(
  transcript: { role: string; content: string }[],
  personaName: string
) {
  const transcriptText = transcript
    .map(m => `${m.role === 'user' ? 'AGENT' : 'CUSTOMER'}: ${m.content}`)
    .join('\n')

  const prompt = `You are evaluating a customer support training session.
The AI played the role of: ${personaName}

Full transcript:
${transcriptText}

Evaluate the AGENT's performance and return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "empathyScore": <integer 1-5>,
  "resolved": <true or false>,
  "deEscalation": <"effective" | "partial" | "none" | "inappropriate">,
  "responseQualityScore": <integer 1-5>,
  "avgResponseTime": 38,
  "feedback": [
    { "type": "positive", "metric": "Empathy", "text": "<one specific empathy strength>" },
    { "type": "positive", "metric": "Issue Resolution", "text": "<one specific resolution strength>" },
    { "type": "improvement", "metric": "De-escalation", "text": "<one specific de-escalation improvement>" },
    { "type": "improvement", "metric": "Response Quality", "text": "<one specific response quality improvement>" }
  ]
}

Scoring guidance:
- empathyScore: 1=robotic/dismissive, 2=token phrases only, 3=developing, 4=consistent+genuine, 5=proactive/exceptional
- resolved: true only if the customer's core issue was fully addressed or clearly escalated with a named timeline
- deEscalation: effective=customer moved from high to low intensity without inappropriate promises, partial=some reduction, none=intensity stayed high or increased, inappropriate=agent made promises they should not have
- responseQualityScore: 1-5 composite of accuracy, clarity, tone-matching, professionalism`

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 600,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0].message.content ?? '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return {
      empathyScore: 3,
      resolved: false,
      deEscalation: 'partial',
      responseQualityScore: 3,
      avgResponseTime: 38,
      feedback: [
        { type: 'improvement', metric: 'General', text: 'Could not parse score — check your OpenAI key.' }
      ]
    }
  }
}