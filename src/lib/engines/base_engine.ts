export interface AssessmentResult {
  rawScore: number;
  calculatedData: any;
  classification?: string;
  percentile?: number;
}

export abstract class BaseTestEngine {
  readonly testCode: string;

  constructor(testCode: string) {
    this.testCode = testCode;
  }

  // Menerima raw answers dari frontend (bisa array, obyek, dll.)
  abstract calculateScores(answers: any, clientData?: any, ...args: any[]): Promise<AssessmentResult>;

  // Membuat prompt AI dari hasil kalkulasi
  abstract buildAiPrompt(calculatedData: any, clientData: any, ...args: any[]): string;
}
