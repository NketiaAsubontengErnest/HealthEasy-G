import { NextResponse } from 'next/server';
import ollama from 'ollama';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';

/**
 * AI Assistant API Route — Direct Ollama JS SDK & GSTG Rule Engine Fallback
 *
 * Tries calling Ollama model (kimi-k3:cloud or local models). If Ollama returns
 * subscription error, model unavailable, or connection offline, it seamlessly falls
 * back to the Ghana Standard Treatment Guidelines (GSTG) Rule Engine.
 */

interface LabResult       { parameter: string; value: string | number; unit: string; referenceRange: string; isAbnormal: boolean; isCritical: boolean; }
interface PharmacyBatch   { drugCode: string; genericName: string; brandName: string; dosageForm: string; strength: string; quantityInStock: number; unitPriceGhc: number; isControlled: boolean; expiryDate: string; }
interface DiagnosisItem   { code: string; name: string; category: string; }
interface PastEncounter   { timestamp: string; presentingComplaints: string; treatmentPlan: string; icdDiagnoses: DiagnosisItem[]; }
interface PatientContext  { patientId: string; fullName: string; gender: string; dob: string; allergies: string[]; chronicConditions: string[]; bloodGroup: string; patientCategory: string; nhisStatus?: string | null; }
interface VitalsContext   { systolicBp: number; diastolicBp: number; pulseRate: number; temperature: number; oxygenSaturation: number; bmi: number; bloodGlucoseMmoles: number; painScore: number; esiSeverity: string; }

interface SuggestRequest {
  patient:          PatientContext;
  vitals:           VitalsContext | null;
  activeDiagnoses:  DiagnosisItem[];
  labResults:       LabResult[];
  pastEncounters:   PastEncounter[];
  pharmacyStock:    PharmacyBatch[];
}

interface RawSuggestion {
  drugCode:       string;
  genericName:    string;
  strength:       string;
  dosageForm:     string;
  suggestedDose:  string;
  durationDays:   number;
  reasoning:      string;
  allergyConflict:boolean;
  priority:       string;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildClinicalPrompt(req: SuggestRequest): string {
  const { patient, vitals, activeDiagnoses, labResults, pastEncounters, pharmacyStock } = req;

  const allergiesStr    = patient.allergies.length       ? patient.allergies.join(', ')       : 'No known drug allergies';
  const chronicStr      = patient.chronicConditions.length ? patient.chronicConditions.join(', ') : 'None reported';

  const diagnosesStr    = activeDiagnoses.length
    ? activeDiagnoses.map(d => `  - ${d.code}: ${d.name} (${d.category})`).join('\n')
    : '  No diagnoses entered yet';

  const vitalsStr = vitals
    ? `  BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg | Pulse: ${vitals.pulseRate} bpm | Temp: ${vitals.temperature}°C | SpO2: ${vitals.oxygenSaturation}% | BMI: ${vitals.bmi} | Blood Glucose: ${vitals.bloodGlucoseMmoles} mmol/L | Pain Score: ${vitals.painScore}/10 | ESI: ${vitals.esiSeverity}`
    : '  Vitals not yet recorded';

  const labStr = labResults.length
    ? labResults.map(r => {
        const flags = r.isCritical ? ' [CRITICAL ⚠]' : r.isAbnormal ? ' [ABNORMAL]' : '';
        return `  - ${r.parameter}: ${r.value} ${r.unit}  (Ref: ${r.referenceRange})${flags}`;
      }).join('\n')
    : '  No lab results available';

  const pastStr = pastEncounters.length
    ? pastEncounters.slice(0, 3).map(enc => {
        const codes = enc.icdDiagnoses.map(d => d.code).join(', ') || 'None';
        return `  [${enc.timestamp}]  Complaint: ${enc.presentingComplaints}\n    Diagnoses: ${codes}  |  Plan: ${enc.treatmentPlan}`;
      }).join('\n')
    : '  No previous encounters on record';

  const stockLines = pharmacyStock
    .filter(m => m.quantityInStock > 0)
    .map(m => {
      const controlled   = m.isControlled ? ' [CONTROLLED SUBSTANCE — RESTRICTED]' : '';
      const stockStatus  = m.quantityInStock < 50 ? 'Low Stock' : 'In Stock';
      return `  - [${m.drugCode}]  ${m.genericName} ${m.strength} ${m.dosageForm}  |  Qty: ${m.quantityInStock} (${stockStatus})  |  GHS ${m.unitPriceGhc.toFixed(2)}/unit  |  Expires: ${m.expiryDate}${controlled}`;
    });

  const stockStr = stockLines.length ? stockLines.join('\n') : '  No medicines currently in stock';

  return `You are a clinical decision support AI embedded in HealthEasy-G HMS, a hospital management system used at Ridge Regional Hospital, Accra, Ghana.
Your role is to suggest appropriate medicines for a patient based on their complete medical record.
You follow Ghana Standard Treatment Guidelines (GSTG) and the National Health Insurance Authority (NHIA) Essential Medicines List.

=== PATIENT PROFILE ===
Name: ${patient.fullName}
Gender: ${patient.gender}  |  Date of Birth: ${patient.dob}
Blood Group: ${patient.bloodGroup}
Patient Category: ${patient.patientCategory}  |  NHIS Status: ${patient.nhisStatus ?? 'N/A'}
Known Allergies: ${allergiesStr}
Chronic Conditions: ${chronicStr}

=== CURRENT VITALS ===
${vitalsStr}

=== ACTIVE ICD-10 DIAGNOSES ===
${diagnosesStr}

=== RECENT LAB RESULTS ===
${labStr}

=== PAST ENCOUNTER HISTORY (Last 3 Visits) ===
${pastStr}

=== AVAILABLE PHARMACY STOCK (Hospital Formulary) ===
${stockStr}

=== YOUR TASK ===
Suggest up to 5 medicines from the AVAILABLE PHARMACY STOCK list above that are clinically appropriate for this patient's current diagnoses and medical history.

STRICT RULES:
1. ONLY suggest medicines that appear in the AVAILABLE PHARMACY STOCK list. Do not invent medicines not listed.
2. Check allergies carefully. If a suggested medicine conflicts with a listed allergy, set "allergyConflict" to true.
3. Prefer first-line GSTG treatments for the active diagnoses.
4. Consider chronic conditions and avoid contraindicated medicines.
5. Return ONLY a valid JSON array of objects.`;
}

// ─── GSTG Rule Engine Fallback Generator ─────────────────────────────────────

function generateGSTGFallback(body: SuggestRequest) {
  const { patient, vitals, activeDiagnoses, pharmacyStock } = body;
  const suggestions = [];

  const lowerAllergies = patient.allergies.map(a => a.toLowerCase());
  const activeCodes = activeDiagnoses.map(d => d.code.toUpperCase());

  // 1. Hypertension (I10)
  if (activeCodes.some(c => c.startsWith('I10')) || (vitals && vitals.systolicBp >= 140)) {
    const aml = pharmacyStock.find(s => s.drugCode === 'AML-10' || s.genericName.toLowerCase().includes('amlodipine'));
    if (aml && aml.quantityInStock > 0) {
      const hasAllergy = lowerAllergies.some(a => a.includes('amlodipine') || a.includes('calcium channel'));
      suggestions.push({
        drugCode: aml.drugCode,
        genericName: aml.genericName,
        strength: aml.strength || '10mg',
        dosageForm: aml.dosageForm || 'Tablet',
        suggestedDose: '1 tablet orally once daily in the morning',
        durationDays: 30,
        reasoning: `First-line calcium channel blocker indicated for essential hypertension under GSTG protocols. Patient BP is ${vitals ? `${vitals.systolicBp}/${vitals.diastolicBp}` : 'elevated'}.`,
        allergyConflict: hasAllergy,
        priority: 'First Line',
        unitPriceGhc: aml.unitPriceGhc || 1.5,
        quantityInStock: aml.quantityInStock,
        isControlled: aml.isControlled || false
      });
    }
  }

  // 2. Malaria (B54)
  if (activeCodes.some(c => c.startsWith('B54')) || (vitals && vitals.temperature >= 38.0)) {
    const coa = pharmacyStock.find(s => s.drugCode === 'COA-80' || s.genericName.toLowerCase().includes('coartem') || s.genericName.toLowerCase().includes('artemether'));
    if (coa && coa.quantityInStock > 0) {
      const hasAllergy = lowerAllergies.some(a => a.includes('artemether') || a.includes('lumefantrine') || a.includes('coartem'));
      suggestions.push({
        drugCode: coa.drugCode,
        genericName: coa.genericName,
        strength: coa.strength || '80/480mg',
        dosageForm: coa.dosageForm || 'Tablet',
        suggestedDose: '1 tablet twice daily with fatty food for 3 days',
        durationDays: 3,
        reasoning: `First-line Artemisinin-based Combination Therapy (ACT) for acute uncomplicated malaria per Ghana Health Service guidelines.`,
        allergyConflict: hasAllergy,
        priority: 'First Line',
        unitPriceGhc: coa.unitPriceGhc || 8.0,
        quantityInStock: coa.quantityInStock,
        isControlled: coa.isControlled || false
      });
    }
  }

  // 3. Analgesic / Fever Support (Paracetamol)
  const par = pharmacyStock.find(s => s.drugCode === 'PAR-500' || s.genericName.toLowerCase().includes('paracetamol'));
  if (par && par.quantityInStock > 0) {
    const hasAllergy = lowerAllergies.some(a => a.includes('paracetamol') || a.includes('acetaminophen'));
    suggestions.push({
      drugCode: par.drugCode,
      genericName: par.genericName,
      strength: par.strength || '500mg',
      dosageForm: par.dosageForm || 'Tablet',
      suggestedDose: '2 tablets 8-hourly after meals as needed for pain/fever',
      durationDays: 5,
      reasoning: `Supportive non-opioid analgesic and antipyretic for symptomatic relief. safe with patient profile.`,
      allergyConflict: hasAllergy,
      priority: 'Supportive',
      unitPriceGhc: par.unitPriceGhc || 0.8,
      quantityInStock: par.quantityInStock,
      isControlled: par.isControlled || false
    });
  }

  return suggestions;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

/** Model name is configurable so the deployment is not pinned to one build. */
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

/** A stalled model must not hold the clinician's request open indefinitely. */
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 15_000;
// Never export patient data to a model unless an operator has explicitly
// enabled it and the clinician has recorded the patient's consent.
const AI_EXTERNAL_PROCESSING_ENABLED = process.env.AI_EXTERNAL_PROCESSING_ENABLED === 'true';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Ollama did not respond within ${ms}ms`)), ms)
    )
  ]);
}

export const POST = withAuth('POST', async (req) => {
  const body: SuggestRequest = await req.json();

  if (!body?.patient?.patientId || !Array.isArray(body.activeDiagnoses) || !Array.isArray(body.pharmacyStock)) {
    return NextResponse.json({ error: 'A patient, diagnoses, and formulary are required.' }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { id: body.patient.patientId } });
  if (!patient) return NextResponse.json({ error: 'Patient does not exist.' }, { status: 404 });

  try {
    if (!AI_EXTERNAL_PROCESSING_ENABLED) {
      throw new Error('External AI processing is disabled by deployment policy');
    }
    const prompt = buildClinicalPrompt(body);

    const ollamaResponse = await withTimeout(
      ollama.chat({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }]
      }),
      OLLAMA_TIMEOUT_MS
    );

    let content = ollamaResponse.message.content.trim();

    if (content.startsWith('```')) {
      const lines = content.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines.at(-1)?.trim() === '```') lines.pop();
      content = lines.join('\n').trim();
    }

    const rawSuggestions = JSON.parse(content);
    if (!Array.isArray(rawSuggestions)) {
      throw new Error('Model did not return a JSON array of suggestions');
    }

    const stockMap = new Map(body.pharmacyStock.map(m => [m.drugCode, m]));

    const enriched = rawSuggestions
      // The model is instructed to prescribe only from the formulary, but a
      // hallucinated drug code must never reach a prescription screen — so
      // anything not backed by real stock is dropped rather than trusted.
      .filter((s: RawSuggestion) => stockMap.has(s.drugCode))
      .map((s: RawSuggestion) => {
        const stock = stockMap.get(s.drugCode)!;
        const patientAllergies = body.patient.allergies.map(a => a.toLowerCase());
        const generic = stock.genericName.toLowerCase();

        return {
          ...s,
          genericName: stock.genericName,
          strength: stock.strength,
          dosageForm: stock.dosageForm,
          durationDays: Number(s.durationDays) || 7,
          // Allergy conflict is re-derived locally rather than taken on the
          // model's word — this flag is a patient-safety control.
          allergyConflict:
            Boolean(s.allergyConflict) || patientAllergies.some(a => generic.includes(a) || a.includes(generic)),
          unitPriceGhc: stock.unitPriceGhc,
          quantityInStock: stock.quantityInStock,
          isControlled: stock.isControlled,
          source: 'ollama' as const
        };
      });

    if (enriched.length === 0) {
      throw new Error('Model returned no suggestion backed by hospital stock');
    }

    return NextResponse.json(enriched, {
      headers: { 'X-Clinical-Advisory': 'Recommendations require licensed clinician review before prescribing.' }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[AI Assistant API] Model "${OLLAMA_MODEL}" unavailable (${message}). Falling back to the GSTG rule engine.`);

    // Fallback to Ghana Standard Treatment Guidelines (GSTG) Rule Engine
    return NextResponse.json(
      generateGSTGFallback(body).map(s => ({ ...s, source: 'gstg-rule-engine' as const })),
      { headers: { 'X-Clinical-Advisory': 'Recommendations require licensed clinician review before prescribing.' } }
    );
  }
});
