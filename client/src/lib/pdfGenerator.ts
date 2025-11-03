import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ElectionResults } from "@shared/schema";

export function generateElectionAuditPDF(electionResults: ElectionResults): void {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Auditoria de Eleição", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("UMP Emaús - Sistema Emaús Vota", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const generationDate = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  doc.text(`Gerado em: ${generationDate}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Eleição: ${electionResults.electionName}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Total de Membros Presentes: ${electionResults.presentCount}`, margin, yPosition);
  yPosition += 12;

  const completedPositions = electionResults.positions.filter(p => p.status === "completed");

  if (completedPositions.length === 0) {
    doc.text("Nenhum cargo foi concluído nesta eleição.", margin, yPosition);
    doc.save(`Auditoria_${electionResults.electionName.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resultados por Cargo", margin, yPosition);
  yPosition += 10;

  completedPositions.forEach((position, index) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${position.positionName}`, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Escrutínio: ${position.currentScrutiny}º`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total de Votantes: ${position.totalVoters}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Maioria Necessária: ${position.majorityThreshold} votos`, margin, yPosition);
    yPosition += 8;

    const electedCandidate = position.candidates.find(c => c.isElected);
    
    if (electedCandidate) {
      doc.setFillColor(220, 252, 231);
      doc.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text(`✓ Eleito: ${electedCandidate.candidateName} (${electedCandidate.voteCount} votos)`, margin, yPosition);
      yPosition += 10;
    }

    const tableData = position.candidates.map(candidate => [
      candidate.candidateName,
      candidate.candidateEmail,
      candidate.voteCount.toString(),
      candidate.isElected ? "Sim" : "Não",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Candidato", "Email", "Votos", "Eleito"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 65 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  });

  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("_______________________________________________", margin, yPosition);
  yPosition += 7;
  doc.text("Este relatório foi gerado automaticamente pelo Sistema Emaús Vota.", margin, yPosition);
  yPosition += 5;
  doc.text("Representa o registro oficial dos resultados da eleição.", margin, yPosition);

  const fileName = `Auditoria_${electionResults.electionName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
