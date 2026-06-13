"use client";

import jsPDF from "jspdf";

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawTable(
  pdf: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  startX: number,
  startY: number,
  colWidths: number[],
  pageWidth: number,
) {
  const lineH = 7;
  const headerBg = [99, 102, 241]; // indigo
  const altRowBg = [249, 250, 251]; // gray-50
  const margin = 12;
  const ph = pdf.internal.pageSize.getHeight();
  let y = startY;

  function drawHeader() {
    pdf.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      pdf.rect(x, y, colWidths[i], lineH, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(h, x + 1.5, y + 5);
    });
    y += lineH;
  }

  function checkPage(): number {
    if (y + lineH > ph - margin) {
      pdf.addPage();
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, ph, "F");
      y = margin + 6;
      drawHeader();
    }
    return y;
  }

  drawHeader();

  rows.forEach((row, ri) => {
    checkPage();
    if (ri % 2 === 1) {
      pdf.setFillColor(altRowBg[0], altRowBg[1], altRowBg[2]);
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      pdf.rect(startX, y, totalW, lineH, "F");
    }
    pdf.setTextColor(55, 65, 81); // gray-700
    pdf.setFontSize(8);
    row.forEach((cell, ci) => {
      const x = startX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
      pdf.text(String(cell), x + 1.5, y + 5);
    });
    y += lineH;
  });

  return y;
}

export function generateIqPdf({
  templateName,
  subjectName,
  standardScore,
  percentile,
  ciLow,
  ciHigh,
  categoryLabel,
  rawCorrectCount,
  weightedScore,
  maxWeighted,
  interpretation,
  breakdownByCategory,
  passingStandardScore,
}: {
  templateName: string;
  subjectName: string;
  standardScore: number;
  percentile: number;
  ciLow: number;
  ciHigh: number;
  categoryLabel: string;
  rawCorrectCount: number;
  weightedScore: number;
  maxWeighted: number;
  interpretation: string;
  breakdownByCategory: Record<string, { percentile: number; correct: number; total: number }>;
  passingStandardScore?: number | null;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 12;

  // Cover page
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.text("Cognitive Assessment Report", pw / 2, ph / 2 - 40, { align: "center" });
  pdf.setFontSize(14);
  pdf.setTextColor(160, 160, 160);
  pdf.text(subjectName, pw / 2, ph / 2, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(formatDate(), pw / 2, ph / 2 + 16, { align: "center" });
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.5);
  pdf.line(pw / 2 - 30, ph / 2 + 32, pw / 2 + 30, ph / 2 + 32);

  // Page 1: Score overview
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(16);
  pdf.text("Score Overview", m, m + 6);

  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(28);
  pdf.text(String(Math.round(standardScore)), m, m + 22);

  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(10);
  pdf.text(`Standard score (μ=100, σ=15)  |  Higher than ~${percentile.toFixed(1)}% of population`, m + 28, m + 20);
  pdf.setFontSize(9);
  pdf.text(
    `90% confidence band: ${Math.round(ciLow)}–${Math.round(ciHigh)}  |  Category: ${categoryLabel}`,
    m + 28,
    m + 28,
  );

  if (passingStandardScore != null) {
    const pass = standardScore >= passingStandardScore;
    pdf.setTextColor(pass ? 22 : 180, pass ? 163 : 83, pass ? 74 : 9);
    pdf.setFontSize(9);
    pdf.text(`Screening threshold: ${pass ? "Pass" : "Below"} (≥ ${passingStandardScore})`, m, m + 38);
  }

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(9);
  pdf.text(`${rawCorrectCount} correct  ·  weighted ${weightedScore.toFixed(2)} / ${maxWeighted.toFixed(2)}`, m, m + 48);

  // Area breakdown table
  const colWidths = [40, 25, 25];
  const headers = ["Area", "Correct", "Percentile"];
  const rows: (string | number)[][] = [];
  const labels: Record<string, string> = {
    verbal: "Verbal",
    numerical: "Numerical",
    logical: "Logical",
    spatial: "Spatial",
    general: "General",
  };
  for (const [key, val] of Object.entries(breakdownByCategory)) {
    if (val && val.total > 0) {
      rows.push([labels[key] || key, `${val.correct}/${val.total}`, `~${val.percentile.toFixed(0)}th`]);
    }
  }

  if (rows.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(30, 30, 30);
    pdf.text("Area Breakdown", m, m + 64);
    drawTable(pdf, headers, rows, m, m + 68, colWidths, pw);
  }

  // Interpretation page
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(14);
  pdf.text("Workplace Interpretation", m, m + 6);
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);

  const lines = pdf.splitTextToSize(interpretation, pw - m * 2);
  pdf.text(lines, m, m + 16);

  pdf.save(`cognitive-assessment_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

export function generateEqPdf({
  templateName,
  subjectName,
  compositeScore,
  percentileComposite,
  domainScores,
  percentileByDomain,
  highestDomain,
  lowestDomain,
  variance,
  quadrantLabel,
  domainKeys,
  domainLabels,
  narrativeText,
}: {
  templateName: string;
  subjectName: string;
  compositeScore: number;
  percentileComposite: number;
  domainScores: Record<string, number>;
  percentileByDomain: Record<string, number>;
  highestDomain: string;
  lowestDomain: string;
  variance: number;
  quadrantLabel: string;
  domainKeys: readonly string[];
  domainLabels: Record<string, string>;
  narrativeText: string;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 12;

  // Cover page
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.text("EQ Profile Report", pw / 2, ph / 2 - 40, { align: "center" });
  pdf.setFontSize(14);
  pdf.setTextColor(160, 160, 160);
  pdf.text(subjectName, pw / 2, ph / 2, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(formatDate(), pw / 2, ph / 2 + 16, { align: "center" });
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.5);
  pdf.line(pw / 2 - 30, ph / 2 + 32, pw / 2 + 30, ph / 2 + 32);

  // Page 1: Overview + domain scores
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(16);
  pdf.text("EQ Score Overview", m, m + 6);

  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(28);
  pdf.text(String(Math.round(compositeScore)), m, m + 22);

  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(10);
  pdf.text(`Composite EQ Score  |  ~${percentileComposite.toFixed(0)}th percentile`, m + 20, m + 20);

  pdf.setFontSize(9);
  pdf.text(`Zone: ${quadrantLabel}`, m, m + 34);

  // Domain table
  const colWidths = [50, 25, 25];
  const headers = ["Domain", "Score", "Percentile"];
  const rows = domainKeys.map((k) => [
    domainLabels[k] || k,
    `${Math.round(domainScores[k] ?? 0)}%`,
    `~${(percentileByDomain[k] ?? 0).toFixed(0)}th`,
  ]);

  pdf.setFontSize(12);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Domain Breakdown", m, m + 50);
  drawTable(pdf, headers, rows, m, m + 54, colWidths, pw);

  // Highlights
  const highlightsY = m + 54 + rows.length * 7 + 10;
  pdf.setFontSize(12);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Highlights", m, highlightsY);
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  pdf.text(`Greatest strength: ${domainLabels[highestDomain] || highestDomain}`, m, highlightsY + 10);
  pdf.text(`Growth opportunity: ${domainLabels[lowestDomain] || lowestDomain}`, m, highlightsY + 18);
  pdf.text(`Balance spread: σ ≈ ${variance.toFixed(1)}`, m, highlightsY + 26);

  // Narrative page
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(14);
  pdf.text("AI Coaching Narrative", m, m + 6);
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);

  const lines = pdf.splitTextToSize(narrativeText, pw - m * 2);
  pdf.text(lines, m, m + 16);

  pdf.save(`eq-profile_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

export function generatePsychometricPdf({
  templateName,
  subjectName,
  traitPercentiles,
  summaryLine,
  teamDynamicsText,
  careerInsightsText,
  roleProfileKeys,
  roleMatches,
  oceanTraits,
  oceanLabels,
}: {
  templateName: string;
  subjectName: string;
  traitPercentiles: Record<string, number>;
  summaryLine: string;
  teamDynamicsText: string;
  careerInsightsText: string;
  roleProfileKeys: string[];
  roleMatches: Record<string, number>;
  oceanTraits: readonly string[];
  oceanLabels: Record<string, string>;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 12;

  // Cover page
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.text("Personality Profile Report", pw / 2, ph / 2 - 40, { align: "center" });
  pdf.setFontSize(14);
  pdf.setTextColor(160, 160, 160);
  pdf.text(subjectName, pw / 2, ph / 2, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(formatDate(), pw / 2, ph / 2 + 16, { align: "center" });
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.5);
  pdf.line(pw / 2 - 30, ph / 2 + 32, pw / 2 + 30, ph / 2 + 32);

  // Page 1: Overview + trait table
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(16);
  pdf.text("Personality Profile", m, m + 6);

  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  const summaryLines = pdf.splitTextToSize(summaryLine, pw - m * 2);
  pdf.text(summaryLines, m, m + 16);

  const traitTableY = m + 16 + summaryLines.length * 4 + 8;
  pdf.setFontSize(12);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Trait Scores", m, traitTableY);

  const colWidths = [50, 25];
  const headers = ["Trait", "Percentile"];
  const rows = oceanTraits.map((t) => [
    oceanLabels[t] || t,
    `~${(traitPercentiles[t] ?? 0).toFixed(0)}th`,
  ]);
  drawTable(pdf, headers, rows, m, traitTableY + 4, colWidths, pw);

  // Role fit table
  if (roleProfileKeys.length > 0) {
    const roleY = traitTableY + 4 + rows.length * 7 + 10;
    pdf.setFontSize(12);
    pdf.setTextColor(30, 30, 30);
    pdf.text("Role Fit", m, roleY);

    const roleColWidths = [50, 20];
    const roleHeaders = ["Role", "Match"];
    const roleRows = roleProfileKeys.map((k) => [k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), `${roleMatches[k] ?? 0}%`]);
    drawTable(pdf, roleHeaders, roleRows, m, roleY + 4, roleColWidths, pw);
  }

  // Team dynamics page
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(14);
  pdf.text("Team Dynamics", m, m + 6);
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  const teamLines = pdf.splitTextToSize(teamDynamicsText, pw - m * 2);
  pdf.text(teamLines, m, m + 16);

  // Career insights page
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, "F");
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(14);
  pdf.text("Career Insights", m, m + 6);
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  const careerLines = pdf.splitTextToSize(careerInsightsText, pw - m * 2);
  pdf.text(careerLines, m, m + 16);

  pdf.save(`personality-profile_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
