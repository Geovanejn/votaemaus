import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ElectionResults, ElectionAuditData } from "@shared/schema";

async function loadImageAsBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = imagePath;
  });
}

export async function generateElectionAuditPDF(electionResults: ElectionResults | ElectionAuditData): Promise<void> {
  const results = 'results' in electionResults ? electionResults.results : electionResults;
  const auditData = 'results' in electionResults ? electionResults : null;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const logoWidth = pageWidth * 0.4;
  const logoHeight = logoWidth * 0.3;
  
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, yPosition, logoWidth, logoHeight);
    yPosition += logoHeight + 15;
  } catch (error) {
    console.warn('Logo não pôde ser carregado no PDF:', error);
    yPosition += 10;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE AUDITORIA DE ELEIÇÃO", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  doc.setFontSize(11);
  doc.text("União da Mocidade Presbiteriana Emaús", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Eleição: ${results.electionName}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Total de Membros Presentes: ${results.presentCount}`, margin, yPosition);
  yPosition += 7;

  const closedAt = auditData?.electionMetadata?.closedAt;
  if (closedAt) {
    const closureDate = new Date(closedAt);
    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const formattedDate = `${closureDate.getDate()} de ${monthNames[closureDate.getMonth()]} de ${closureDate.getFullYear()}`;
    const formattedTime = closureDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    
    doc.text(`Data de Fechamento: ${formattedDate} às ${formattedTime}`, margin, yPosition);
    yPosition += 7;
  }

  doc.text(`Localização: São Paulo, SP`, margin, yPosition);
  yPosition += 12;

  if (auditData?.voterAttendance && auditData.voterAttendance.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Lista de Votantes Presentes", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const voterData = auditData.voterAttendance.map((v: any) => [
      v.voterName,
      v.voterEmail,
      v.totalVotes.toString(),
      new Date(v.firstVoteAt).toLocaleString("pt-BR", { 
        day: "2-digit", 
        month: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Nome", "Email", "Votos", "Primeiro Voto"]],
      body: voterData,
      theme: "grid",
      headStyles: { 
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255], 
        fontStyle: "bold",
        halign: "center"
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  const completedPositions = results.positions.filter(p => p.status === "completed");

  if (completedPositions.length === 0) {
    doc.text("Nenhum cargo foi concluído nesta eleição.", margin, yPosition);
    doc.save(`Auditoria_${results.electionName.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Resultados por Cargo e Escrutínio", margin, yPosition);
  yPosition += 10;

  completedPositions.forEach((position, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${position.positionName}`, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const electedCandidate = position.candidates.find(c => c.isElected);
    const scrutinyUsed = electedCandidate?.electedInScrutiny || position.currentScrutiny;
    
    doc.text(`Escrutínio de Eleição: ${scrutinyUsed}º`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total de Votantes: ${position.totalVoters}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Maioria Necessária: ${position.majorityThreshold} votos`, margin, yPosition);
    yPosition += 8;

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
      theme: "grid",
      headStyles: { 
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255], 
        fontStyle: "bold",
        halign: "center"
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 65 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  });

  if (auditData?.voteTimeline && auditData.voteTimeline.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. Detalhamento de Votos Individuais", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Registro completo de quem votou em quem em cada cargo:", margin, yPosition);
    yPosition += 10;

    const voteTimelineData = auditData.voteTimeline.map((v: any) => [
      v.voterName,
      v.positionName,
      v.candidateName,
      `${v.scrutinyRound}º`,
      new Date(v.votedAt).toLocaleString("pt-BR", { 
        day: "2-digit", 
        month: "2-digit",
        hour: "2-digit", 
        minute: "2-digit" 
      }),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Votante", "Cargo", "Candidato Escolhido", "Esc.", "Data/Hora"]],
      body: voteTimelineData,
      theme: "grid",
      headStyles: { 
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255], 
        fontStyle: "bold",
        halign: "center",
        fontSize: 8
      },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  doc.addPage();
  yPosition = margin + 40;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const currentDate = new Date();
  if (closedAt) {
    const closureDate = new Date(closedAt);
    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const formattedDate = `${closureDate.getDate()} de ${monthNames[closureDate.getMonth()]} de ${closureDate.getFullYear()}`;
    const formattedTime = closureDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    
    doc.text(`São Paulo, SP, ${formattedDate} às ${formattedTime}`, pageWidth / 2, yPosition, { align: "center" });
  } else {
    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const formattedDate = `${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    
    doc.text(`São Paulo, SP, ${formattedDate}`, pageWidth / 2, yPosition, { align: "center" });
  }
  yPosition += 40;

  doc.setDrawColor(0, 0, 0);
  doc.line(margin, yPosition, margin + 80, yPosition);
  yPosition += 5;
  
  const presidentName = (auditData as any)?.presidentName;
  if (presidentName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(presidentName, margin, yPosition);
    yPosition += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Presidente em Exercício da UMP Emaús", margin, yPosition);
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("_________________________________", margin, yPosition);
    yPosition += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Presidente em Exercício da UMP Emaús", margin, yPosition);
  }
  
  yPosition += 20;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Este relatório foi gerado automaticamente pelo Sistema Emaús Vota.", margin, yPosition);
  yPosition += 4;
  doc.text("Representa o registro oficial e auditável dos resultados da eleição.", margin, yPosition);

  const fileName = `Auditoria_${results.electionName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
