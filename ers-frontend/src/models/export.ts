import { CaseEvaluation } from './cases';

export type ExportFormat = 'pdf' | 'csv';

export interface ExportRequest {
  format: ExportFormat;
  evaluation: CaseEvaluation;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  format: ExportFormat;
  message: string;
}
