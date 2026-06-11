"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type PdfPageConfig = {
  element: HTMLElement;
  title?: string;
};

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generatePdf({
  reportTitle,
  subjectName,
  sections,
  filename,
}: {
  reportTitle: string;
  subjectName: string;
  sections: PdfPageConfig[];
  filename: string;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 12;

  // Cover page
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pw, ph, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.text(reportTitle, pw / 2, ph / 2 - 40, { align: "center" });

  pdf.setFontSize(14);
  pdf.setTextColor(160, 160, 160);
  pdf.text(subjectName, pw / 2, ph / 2, { align: "center" });

  pdf.setFontSize(11);
  pdf.text(formatDate(), pw / 2, ph / 2 + 16, { align: "center" });

  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.5);
  pdf.line(pw / 2 - 30, ph / 2 + 32, pw / 2 + 30, ph / 2 + 32);

  // Content pages
  for (const section of sections) {
    const canvas = await html2canvas(section.element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: () => {
        const elements = section.element.querySelectorAll("[style*='color-adjust'], [style*='print-color']");
        elements.forEach((el) => {
          (el as HTMLElement).style.setProperty("color-adjust", "exact", "important");
          (el as HTMLElement).style.setProperty("print-color-adjust", "exact", "important");
        });
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const imgW = pw - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pw, ph, "F");

    if (section.title) {
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(11);
      pdf.text(section.title, margin, margin + 6);
    }

    const yStart = section.title ? margin + 12 : margin;

    if (imgH <= ph - yStart - margin) {
      pdf.addImage(imgData, "JPEG", margin, yStart, imgW, imgH);
    } else {
      const pageImgH = ph - yStart - margin;
      const ratio = pageImgH / imgH;
      pdf.addImage(imgData, "JPEG", margin, yStart, imgW * ratio, pageImgH);
    }
  }

  pdf.save(filename);
}

export async function captureElement(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  return canvas.toDataURL("image/jpeg", 0.92);
}
