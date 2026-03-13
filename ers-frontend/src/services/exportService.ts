import { RiskEvaluation } from '../models/domain';

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const exportService = {
  exportCsv(evaluation: RiskEvaluation): void {
    const rows = [
      ['campo', 'valor'],
      ['identificador', evaluation.person.identifier],
      ['nombre', evaluation.person.fullName],
      ['score', String(evaluation.score.score)],
      ['nivel', evaluation.score.level],
      ['alertas', String(evaluation.alerts.length)],
      ['resumen', evaluation.score.summary]
    ];

    download(
      rows.map((row) => row.map((value) => `"${value}"`).join(',')).join('\n'),
      `ers-${evaluation.person.identifier}.csv`,
      'text/csv;charset=utf-8'
    );
  },
  exportPdf(evaluation: RiskEvaluation): void {
    const content = [
      'ERS - Informe de Riesgo',
      '',
      `Identificador: ${evaluation.person.identifier}`,
      `Nombre: ${evaluation.person.fullName}`,
      `Score IA: ${evaluation.score.score} (${evaluation.score.level})`,
      `Resumen: ${evaluation.score.summary}`
    ].join('\n');

    download(content, `ers-${evaluation.person.identifier}.pdf`, 'application/pdf');
  }
};
