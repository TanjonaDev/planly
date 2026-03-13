import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  zones: string[];
  skills: string[];
  reliabilityScore: number;
  isAvailable: boolean;
  distanceToSite?: number;
  siteHistory: number; // Number of past missions on this site
}

interface ReplacementContext {
  siteName: string;
  date: string;
  startTime: string;
  endTime: string;
  absentEmployee: string;
  candidates: Employee[];
}

export async function suggestReplacements(context: ReplacementContext) {
  const prompt = `Tu es un assistant de gestion d'équipes de nettoyage. Un employé est absent et il faut trouver un remplaçant.

Contexte :
- Site : ${context.siteName}
- Date : ${context.date}
- Horaire : ${context.startTime} - ${context.endTime}
- Employé absent : ${context.absentEmployee}

Candidats disponibles :
${context.candidates
  .map(
    (c) =>
      `ID: ${c.id}
   Nom: ${c.firstName} ${c.lastName}
   - Disponible sur le créneau : ${c.isAvailable ? "Oui" : "Non"}
   - Zones : ${c.zones.join(", ")}
   - Compétences : ${c.skills.join(", ")}
   - Fiabilité : ${c.reliabilityScore.toFixed(1)}/10
   - Missions passées sur ce site : ${c.siteHistory}`
  )
  .join("\n\n")}

Classe les 3 meilleurs candidats par pertinence. Utilise les IDs exacts fournis ci-dessus.
Pour chaque suggestion, donne une courte explication en français (1 phrase max, ton professionnel).

Réponds UNIQUEMENT en JSON strict :
{
  "suggestions": [
    { "employeeId": "<ID exact>", "score": 95, "reason": "..." }
  ]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned) as {
      suggestions: Array<{
        employeeId: string;
        score: number;
        reason: string;
      }>;
    };
  } catch {
    console.error("Failed to parse AI response:", text);
    return { suggestions: [] };
  }
}

export async function generateMissionReport(missionData: {
  siteName: string;
  date: string;
  employeeName: string;
  checklistCompleted: number;
  checklistTotal: number;
  issues: string[];
}) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Génère un court rapport de prestation de nettoyage en français (3-4 phrases max).

Site : ${missionData.siteName}
Date : ${missionData.date}
Employé : ${missionData.employeeName}
Checklist : ${missionData.checklistCompleted}/${missionData.checklistTotal} tâches effectuées
Problèmes signalés : ${missionData.issues.length > 0 ? missionData.issues.join(", ") : "Aucun"}

Le ton doit être professionnel et factuel.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
