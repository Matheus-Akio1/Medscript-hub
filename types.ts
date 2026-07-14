/**
 * MedScript Reference Hub — Tipagem canônica.
 *
 * Estes tipos são a fonte da verdade para o que a skill diária escreve em
 * `data.js` e para o que o seu SaaS consome. Cada registro coletado é
 * normalizado para uma das cinco entidades abaixo, todas derivadas de
 * `BaseEntry`.
 *
 * IMPORTANTE (conformidade): `Prescription` e `MedicalRecord` só admitem
 * material de REFERÊNCIA — modelos, exemplos sintéticos ou dados
 * desidentificados de fontes públicas conceituadas. Nunca dados reais de
 * pacientes (PHI). O campo `phiStatus` torna isso explícito e obrigatório.
 */

export type EntryType =
  | "document"     // Documentos / artigos / diretrizes em arquivo
  | "information"  // Informações clínicas / notas / resumos
  | "prescription" // Modelos de prescrição de referência
  | "record"       // Prontuários de referência (desidentificados/sintéticos)
  | "medication";  // Monografias / bulas / fármacos

/** Nível de confiança da fonte. */
export type SourceTier = "gold" | "verified" | "community";

/** Estado de PHI — obrigatório em entidades sensíveis. */
export type PhiStatus = "none" | "synthetic" | "deidentified";

/** Autor / origem conceituada do material. */
export interface Author {
  /** Nome do médico ou instituição. */
  name: string;
  /** Ex.: "CRM-SP 123456", "MD, PhD", "FDA", "SBC". */
  credentials?: string;
  /** Especialidade principal, ex.: "Cardiologia". */
  specialty?: string;
  /** Instituição vinculada. */
  institution?: string;
}

/** Referência à fonte original (rastreabilidade). */
export interface SourceRef {
  /** Nome da fonte, ex.: "PubMed", "Anvisa", "UpToDate". */
  name: string;
  /** URL pública de origem, quando houver. */
  url?: string;
  tier: SourceTier;
  /** Licença/uso, ex.: "CC-BY", "public-domain", "fair-use-reference". */
  license?: string;
}

/** Campos comuns a todos os registros. */
export interface BaseEntry {
  /** Identificador estável (slug ou hash). */
  id: string;
  type: EntryType;
  /** Título forte, legível. */
  title: string;
  /** Resumo curto (1–3 frases) para busca e cards. */
  summary: string;
  author: Author;
  source: SourceRef;
  /** Data em que a skill adicionou o registro (ISO YYYY-MM-DD). */
  dateAdded: string;
  /** Data original de publicação da fonte (ISO), se conhecida. */
  datePublished?: string;
  /** Tags livres para filtragem/busca. */
  tags: string[];
  /** Idioma ISO 639-1, ex.: "pt", "en". */
  lang: string;
  /** Passou por checagem humana? */
  verified: boolean;
}

/** Documento em arquivo (PDF, artigo, diretriz). */
export interface DocumentEntry extends BaseEntry {
  type: "document";
  format: "pdf" | "docx" | "html" | "txt" | "image";
  /** Caminho/URL do arquivo, se anexado. */
  fileRef?: string;
  pages?: number;
}

/** Informação clínica / nota de conhecimento. */
export interface InformationEntry extends BaseEntry {
  type: "information";
  /** Corpo em markdown. */
  body: string;
  /** Categoria, ex.: "diretriz", "revisão", "consenso". */
  category?: string;
}

/** Modelo de prescrição de referência (nunca PHI real). */
export interface PrescriptionEntry extends BaseEntry {
  type: "prescription";
  phiStatus: Exclude<PhiStatus, "none">;
  condition: string;
  /** O QUE O PACIENTE APRESENTAVA — quadro clínico que motivou a conduta. */
  presentation: string;
  items: Array<{
    drug: string;
    dose: string;
    route: string;      // "VO", "IV", "SC"...
    frequency: string;  // "8/8h", "1x/dia"...
    duration?: string;
  }>;
  /** Racional/justificativa da prescrição. */
  rationale?: string;
  notes?: string;
}

/**
 * Prontuário de referência desidentificado/sintético.
 * Estrutura SOAP-like: identificação → anamnese → diagnóstico → evolução.
 */
export interface RecordEntry extends BaseEntry {
  type: "record";
  phiStatus: Exclude<PhiStatus, "none">;
  /** Idade em anos ou faixa, ex.: "45", "60-70". */
  ageBand?: string;
  sex?: "M" | "F" | "other" | "unknown";
  /** Bloco de identificação (dados sintéticos: iniciais fictícias, sexo, idade, procedência). */
  identification: string;
  /** Anamnese: queixa, HDA, antecedentes, exame físico. */
  anamnese: string;
  /** Hipótese/diagnóstico. */
  diagnostico: string;
  /** Evolução clínica e conduta ao longo do tempo. */
  evolucao: string;
}

/** Regra de cálculo de dose para a calculadora interativa. */
export interface DosingRule {
  /** Dose por kg de peso (mg/kg/dose). */
  mgPerKg?: number;
  /** Dose máxima por administração (mg). */
  maxDoseMg?: number;
  /** Concentração da forma líquida (mg/mL) para converter em volume. */
  concentrationMgPerMl?: number;
  /** Nº de administrações por dia (para dose diária). */
  timesPerDay?: number;
  /** Observação sobre a fórmula. */
  note?: string;
}

/** Monografia / fármaco. */
export interface MedicationEntry extends BaseEntry {
  type: "medication";
  // — Identificação —
  genericName: string;
  brandNames?: string[];
  drugClass: string;
  indications: string[];
  /** Ex.: "controlado", "isento de prescrição". */
  controlStatus?: string;
  // — Dosagem e Administração —
  administration: string;
  commonDoses?: string[];
  // — Segurança Clínica —
  contraindications?: string[];
  adverseEffects?: string[];
  interactions?: string[];
  /** Categoria de risco na gestação, ex.: "C". */
  pregnancyCategory?: string;
  // — Identificação Física —
  /** Forma farmacêutica, concentração, cor/marcação, ex.: "Comprimido revestido 10 mg, branco". */
  physicalId?: string;
  // — Fórmula de dosagem (calculadora) —
  dosing?: DosingRule;
}

export type Entry =
  | DocumentEntry
  | InformationEntry
  | PrescriptionEntry
  | RecordEntry
  | MedicationEntry;

/** Payload completo servido em `data.js` como `window.MEDSCRIPT_DATA`. */
export interface MedScriptData {
  /** Versão do schema para migrações futuras. */
  schemaVersion: 1;
  /** Última execução da skill (ISO datetime). */
  lastUpdated: string;
  /** Contagem por dia (ISO date -> nº de registros). */
  dailyCounts: Record<string, number>;
  entries: Entry[];
}

declare global {
  interface Window {
    MEDSCRIPT_DATA: MedScriptData;
  }
}
