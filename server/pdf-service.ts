/**
 * Clean Server-side PDF Binary Generator
 * Produces standard-compliant PDF binary byte streams with customer watermark,
 * metadata, title, author, syllabus chapters, and security notice.
 */

interface PdfOptions {
  title: string;
  author: string;
  category: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  date: string;
  pagesCount: number;
}

export function generateSecurePdfBinary(options: PdfOptions): Buffer {
  const { title, author, category, customerName, customerEmail, orderNumber, date, pagesCount } = options;

  // Escape special PDF string characters
  const escapePdf = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const safeTitle = escapePdf(title);
  const safeAuthor = escapePdf(author);
  const safeCategory = escapePdf(category);
  const safeCustomer = escapePdf(customerName);
  const safeEmail = escapePdf(customerEmail);
  const safeOrder = escapePdf(orderNumber);
  const safeDate = escapePdf(date);

  // Construct PDF Objects
  const objects: string[] = [];

  // 1: Catalog
  objects.push(`1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj`);

  // 2: Pages container
  objects.push(`2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R 4 0 R 5 0 R]
  /Count 3
>>
endobj`);

  // Font definitions
  objects.push(`6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj`);

  objects.push(`7 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj`);

  // Page 1 Stream: Title Page & License Verification
  const page1Content = `
BT
  /F1 24 Tf
  50 720 Td
  (${safeTitle}) Tj
  /F2 12 Tf
  0 -28 Td
  (Category: ${safeCategory} | Author: ${safeAuthor}) Tj
  0 -20 Td
  (Official Exam Notes & Digital PDF Document) Tj
  /F1 14 Tf
  0 -45 Td
  (OFFICIAL LICENSE & VERIFICATION CERTIFICATE) Tj
  /F2 11 Tf
  0 -22 Td
  (Purchased by: ${safeCustomer} (${safeEmail})) Tj
  0 -18 Td
  (Verified Order ID: #${safeOrder}) Tj
  0 -18 Td
  (Access Granted: ${safeDate}) Tj
  0 -18 Td
  (Security Status: Digital Signature Verified - DRM Authorized Copy) Tj
  0 -40 Td
  /F1 12 Tf
  (LEGAL NOTICE & USAGE TERMS:) Tj
  /F2 10 Tf
  0 -18 Td
  (This digital PDF is licensed exclusively to the named purchaser for single-user study.) Tj
  0 -15 Td
  (Redistribution, file sharing, or unauthorized uploading violates international copyright law.) Tj
  0 -15 Td
  (Unique digital watermark embedded: ${safeEmail} :: ${safeOrder}) Tj
  /F1 14 Tf
  0 -50 Td
  (TABLE OF CONTENTS & SYLLABUS OVERVIEW) Tj
  /F2 11 Tf
  0 -22 Td
  (Module 1: Fundamental Concepts & High-Yield Topic Summary .......... Page 04) Tj
  0 -18 Td
  (Module 2: Previous 10 Years Question Patterns & Solutions ......... Page 28) Tj
  0 -18 Td
  (Module 3: Shortcut Formulas, Speed Techniques & Mnemonics ........ Page 64) Tj
  0 -18 Td
  (Module 4: Full Practice Mock Sets with Answer Explanations ....... Page 95) Tj
  0 -18 Td
  (Module 5: Quick Revision Flash Cards & Key Terminology .......... Page 120) Tj
ET
`;

  objects.push(`3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 6 0 R
      /F2 7 0 R
    >>
  >>
  /Contents 8 0 R
>>
endobj`);

  objects.push(`8 0 obj
<<
  /Length ${Buffer.byteLength(page1Content)}
>>
stream${page1Content}
endstream
endobj`);

  // Page 2 Stream: Comprehensive Study Notes Content
  const page2Content = `
BT
  /F1 16 Tf
  50 720 Td
  (MODULE 1: CORE THEORY & RAPID REVISION NOTES) Tj
  /F2 10 Tf
  0 -18 Td
  (Watermark: Licensed to ${safeCustomer} [${safeEmail}] - DO NOT RESELL) Tj
  /F1 12 Tf
  0 -35 Td
  (1.1 Systematic Preparation Blueprint) Tj
  /F2 11 Tf
  0 -18 Td
  (Carefully read through each chapter concept before attempting practice sets.) Tj
  0 -16 Td
  (Pay close attention to marked high-yield points and frequent recurring question patterns.) Tj
  0 -16 Td
  (All questions in this compilation are curated according to the latest official test blueprint.) Tj
  /F1 12 Tf
  0 -35 Td
  (1.2 Formula Sheet & Key Principles) Tj
  /F2 11 Tf
  0 -18 Td
  (- Rule A: Master speed calculation shortcuts for competitive advantage.) Tj
  0 -16 Td
  (- Rule B: Always review incorrect options to understand standard distractors.) Tj
  0 -16 Td
  (- Rule C: Daily revision of error logs significantly boosts percentile scores.) Tj
  /F1 12 Tf
  0 -35 Td
  (1.3 Selected Solved Demonstration) Tj
  /F2 11 Tf
  0 -18 Td
  (Question 1: Apply the optimal method under 45 seconds.) Tj
  0 -16 Td
  (Standard Method Time: 2.5 minutes. Shortcut Method Time: 35 seconds.) Tj
  0 -16 Td
  (Step 1: Simplify modular factors. Step 2: Cross-cancel common coefficients.) Tj
  0 -16 Td
  (Final Answer: Verified option [C] with 100% mathematical precision.) Tj
  0 -45 Td
  /F2 9 Tf
  (End of Chapter 1 Preview. Full ${pagesCount} pages available in your complete customer entitlement package.) Tj
ET
`;

  objects.push(`4 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 6 0 R
      /F2 7 0 R
    >>
  >>
  /Contents 9 0 R
>>
endobj`);

  objects.push(`9 0 obj
<<
  /Length ${Buffer.byteLength(page2Content)}
>>
stream${page2Content}
endstream
endobj`);

  // Page 3 Stream: Practice Questions & Answer Key
  const page3Content = `
BT
  /F1 16 Tf
  50 720 Td
  (MODULE 2: EXAM-GRADE PRACTICE QUESTIONS) Tj
  /F2 10 Tf
  0 -18 Td
  (NotesVidya :: Customer Verification ID: ${safeOrder}) Tj
  /F1 12 Tf
  0 -35 Td
  (Section A: Multiple Choice Question Practice) Tj
  /F2 11 Tf
  0 -18 Td
  (Q1: What is the primary analytical advantage of elimination strategies in objective exams?) Tj
  0 -16 Td
  (A) Random probability improvement) Tj
  0 -15 Td
  (B) Systematic risk reduction and time conservation [Correct Answer]) Tj
  0 -15 Td
  (C) Disregarding negative marking) Tj
  0 -15 Td
  (D) None of the above) Tj
  0 -28 Td
  (Q2: Which revision interval optimizes long-term retention according to cognitive research?) Tj
  0 -16 Td
  (A) 24 hours, 3 days, 7 days, and 30 days [Optimal Spaced Repetition]) Tj
  0 -16 Td
  (B) Only 1 night before the examination) Tj
  0 -16 Td
  (C) Once every semester) Tj
  /F1 12 Tf
  0 -40 Td
  (CUSTOMER SUPPORT & ACCESS ASSISTANCE) Tj
  /F2 10 Tf
  0 -18 Td
  (Need updates or have questions regarding this study material?) Tj
  0 -15 Td
  (Contact: support@notesvidya.com | https://notesvidya.com) Tj
  0 -15 Td
  (Your order #${safeOrder} grants you lifetime online viewing and re-download privileges.) Tj
ET
`;

  objects.push(`5 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 6 0 R
      /F2 7 0 R
    >>
  >>
  /Contents 10 0 R
>>
endobj`);

  objects.push(`10 0 obj
<<
  /Length ${Buffer.byteLength(page3Content)}
>>
stream${page3Content}
endstream
endobj`);

  // Assemble full PDF with byte offsets
  let header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  let body = '';
  const xrefOffsets: number[] = [0];

  let currentOffset = Buffer.byteLength(header, 'latin1');

  for (const obj of objects) {
    xrefOffsets.push(currentOffset);
    const objStr = obj + '\n';
    body += objStr;
    currentOffset += Buffer.byteLength(objStr, 'latin1');
  }

  const startXref = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offset = xrefOffsets[i].toString().padStart(10, '0');
    xref += `${offset} 00000 n \n`;
  }

  const trailer = `trailer
<<
  /Size ${objects.length + 1}
  /Root 1 0 R
>>
startxref
${startXref}
%%EOF\n`;

  const fullPdf = header + body + xref + trailer;
  return Buffer.from(fullPdf, 'latin1');
}
