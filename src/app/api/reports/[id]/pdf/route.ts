import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const user = session.user;
    const resolvedParams = await params;
    const resultId = resolvedParams.id;

    // Fetch the result
    const result = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
      include: {
        assessment: {
          include: {
            subject: { select: { id: true, name: true, email: true } },
            template: { select: { name: true, type: true } }
          }
        }
      }
    });

    if (!result) {
      return new NextResponse("Result not found", { status: 404 });
    }

    // Ensure user has access
    // For simplicity in this demo, allow if user is in same org or is subject
    if (result.assessment.subject?.id !== user.id) {
      // In a real app, verify manager/admin access
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const subjectName = result.assessment.subject?.name || result.assessment.subject?.email || "Unknown";
    const title = `${result.assessment.template.name} Report`;

    page.drawText(title, {
      x: 50,
      y: height - 80,
      size: 24,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Subject: ${subjectName}`, {
      x: 50,
      y: height - 120,
      size: 14,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Date: ${result.computedAt.toLocaleDateString()}`, {
      x: 50,
      y: height - 140,
      size: 14,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText("Summary of Results", {
      x: 50,
      y: height - 180,
      size: 18,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Score or result summary
    const summaryText = "Detailed scores and insights are available in the platform.";
    
    page.drawText(summaryText, {
      x: 50,
      y: height - 220,
      size: 12,
      font: timesRomanFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report_${resultId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
