// FIX: Changed to a default import for jsPDF. The 'jspdf-autotable' plugin
// augments the default export, and the previous named import ('{ jsPDF }') did not have
// the correct type information for the plugin, causing errors with 'autoTable' and 'internal.getNumberOfPages'.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MonthlySummary, FacultyRecord } from '../types';

export const generateSummaryPDF = (data: MonthlySummary[], month: string, workingDays: number) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor('#38b2ac');
  doc.text('Faculty Attendance & Salary Summary', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor('#2d3748');
  const selectedDate = new Date(`${month}-02`); // Use day 2 to avoid timezone issues
  const monthYear = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  doc.text(`Report for: ${monthYear}`, 14, 32);
  doc.text(`Total Working Days in Month: ${workingDays}`, 14, 38);

  // Table
  const tableColumn = ["ID", "Name", "Dept", "Present", "CL Avail.", "CL Used", "Unpaid", "Permissions", "Half-Day", "Total Leaves", "Payable", "Salary (INR)"];
  const tableRows: any[][] = [];

  const sortedData = [...data].sort((a, b) => {
    const deptCompare = a.dept.localeCompare(b.dept);
    if (deptCompare !== 0) return deptCompare;

    const designationCompare = a.designation.localeCompare(b.designation);
    if (designationCompare !== 0) return designationCompare;

    return a.name.localeCompare(b.name);
  });

  sortedData.forEach(item => {
    const rowData = [
      item.empId,
      item.name,
      item.dept,
      item.presentDays,
      item.casualLeavesAvailable,
      item.casualLeavesUsed,
      item.unpaidLeave,
      item.permissions,
      item.halfDayLeaves,
      item.totalLeaves.toFixed(1),
      item.payableDays.toFixed(1),
      // FIX: The default jsPDF font doesn't support the Rupee symbol (₹).
      // Format as a plain number and specify the currency in the table header.
      item.calculatedSalary.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    ];
    tableRows.push(rowData);
  });

  // FIX: Cast `doc` to `any` to call the `autoTable` method from the jspdf-autotable plugin.
  // This is a workaround for a TypeScript type definition issue where the plugin's
  // method is not recognized on the jsPDF instance.
  (doc as any).autoTable({
    startY: 50,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
        fillColor: '#38b2ac',
        textColor: '#ffffff',
        fontStyle: 'bold',
    },
    styles: {
        fontSize: 8,
        cellPadding: 2,
    },
    alternateRowStyles: {
        fillColor: '#f7fafc'
    },
    footStyles: {
        fontStyle: 'bold',
        fillColor: '#e2e8f0'
    },
    columnStyles: {
        0: { cellWidth: 10, halign: 'right' },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 15, halign: 'right' },
        7: { cellWidth: 18, halign: 'right' },
        8: { cellWidth: 18, halign: 'right' },
        9: { cellWidth: 18, halign: 'right' },
        10: { cellWidth: 15, halign: 'right' },
        11: { cellWidth: 'auto', halign: 'right' },
    }
  });

  // FIX: Cast `doc.internal` to `any` to access `getNumberOfPages`. This is a workaround
  // for an incorrect or incomplete type definition for the jsPDF `internal` object.
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor('#718096');
    const text = `Page ${i} of ${pageCount} | Generated on: ${new Date().toLocaleDateString()}`;
    const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
    const textX = (doc.internal.pageSize.getWidth() - textWidth) / 2;
    doc.text(text, textX, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`attendance_summary_${month}.pdf`);
};

export const generateBriefSummaryPDF = (data: MonthlySummary[], month: string, workingDays: number) => {
  const doc = new jsPDF({ orientation: 'portrait' });
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor('#38b2ac');
  doc.text('Brief Faculty Salary Summary', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor('#2d3748');
  const selectedDate = new Date(`${month}-02`);
  const monthYear = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  doc.text(`Report for: ${monthYear}`, 14, 32);
  doc.text(`Total Working Days in Month: ${workingDays}`, 14, 38);

  // Table
  const tableColumn = ["S.No", "ID", "Name", "Dept", "Payable Days", "Salary (INR)"];
  const tableRows: any[][] = [];

  const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));

  sortedData.forEach((item, index) => {
    const rowData = [
      index + 1,
      item.empId,
      item.name,
      item.dept,
      item.payableDays.toFixed(1),
      item.calculatedSalary.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    ];
    tableRows.push(rowData);
  });

  (doc as any).autoTable({
    startY: 50,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
        fillColor: '#38b2ac',
        textColor: '#ffffff',
        fontStyle: 'bold',
    },
    styles: {
        fontSize: 9,
        cellPadding: 2,
    },
    alternateRowStyles: {
        fillColor: '#f7fafc'
    },
    columnStyles: {
        0: { cellWidth: 10, halign: 'right' },
        1: { cellWidth: 15, halign: 'right' },
        2: { cellWidth: 60 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 'auto', halign: 'right' },
    }
  });

  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor('#718096');
    const text = `Page ${i} of ${pageCount} | Generated on: ${new Date().toLocaleDateString()}`;
    const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
    const textX = (doc.internal.pageSize.getWidth() - textWidth) / 2;
    doc.text(text, textX, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`brief_summary_${month}.pdf`);
};

// FIX: Removed local declaration of FacultyRecord as it conflicted with the imported type from `types.ts`.
// This ensures the application consistently uses the globally defined FacultyRecord type.
/*
export interface FacultyRecord {
    name: string;
    designation: string;
    dept: string;
    empId: string;
}
*/

export interface LeaveApplicationDetails {
    faculty: FacultyRecord;
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    applicationId: string;
    submissionTimestamp: Date;
}

export const generateLeaveApplicationPDF = (details: LeaveApplicationDetails) => {
    const doc = new jsPDF();

    // Date formatting function
    function formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Header (all black)
    doc.setFontSize(18);
    doc.setTextColor('#000000');
    doc.text('Agni College of Technology', 105, 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Thalambur, Chennai', 105, 17, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Faculty Leave Application Form', 105, 25, { align: 'center' });

    // Metadata
    doc.setFontSize(11);
    doc.text(`Submission Date: ${formatDate(details.submissionTimestamp)}`, 150, 35, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Application ID: ${details.applicationId}`, 150, 40, { align: 'right' });

    // Combined Faculty & Leave Details Table
    const labels = [
        'Faculty Name', 'Designation', 'Department', 'Employee ID',
        'Leave Type', 'From', 'To'
    ];
    const values = [
        details.faculty.name,
        details.faculty.designation,
        details.faculty.dept,
        String(details.faculty.empId),
        details.leaveType,
        formatDate(new Date(details.startDate)),
        formatDate(new Date(details.endDate))
    ];

    const tableX = 20;
    const tableY = 50;
    const colWidth = 80;
    const rowHeight = 8;
    doc.setLineWidth(0.5);
    doc.rect(tableX, tableY, colWidth * 2, rowHeight * labels.length);

    for (let i = 0; i < labels.length; i++) {
        const y = tableY + i * rowHeight;
        if (i > 0) doc.line(tableX, y, tableX + colWidth * 2, y); // horizontal line
        doc.line(tableX + colWidth, y, tableX + colWidth, y + rowHeight); // vertical line

        // Bold left column label
        doc.setFont('helvetica', 'bold');
        doc.text(labels[i], tableX + 2, y + 6);

        // Normal value
        doc.setFont('helvetica', 'normal');
        doc.text(values[i], tableX + colWidth + 2, y + 6);
    }

    // Reason
    const reasonY = tableY + labels.length * rowHeight + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Reason:', tableX, reasonY);
    doc.setFont('helvetica', 'normal');
    doc.text(details.reason, tableX + 15, reasonY, { maxWidth: 170 });

    // Alterations Table
    const alterY = reasonY + 15;
    const alterColWidths = [60, 60, 50];
    const alterHeaders = ['Date', 'Change Made', 'Approved By'];

    doc.setFont('helvetica', 'bold');
    let currentX = tableX;
    alterHeaders.forEach((header, i) => {
        doc.setFillColor(200, 220, 240);
        doc.rect(currentX, alterY, alterColWidths[i], rowHeight, 'FD'); // header
        doc.text(header, currentX + 2, alterY + 6);
        currentX += alterColWidths[i];
    });

    doc.setFont('helvetica', 'normal');
    const emptyRows = 3;
    for (let i = 1; i <= emptyRows; i++) {
        const rowY = alterY + i * rowHeight;
        currentX = tableX;
        alterColWidths.forEach(width => {
            doc.rect(currentX, rowY, width, rowHeight);
            currentX += width;
        });
    }

    // Signatures
    const signatureY = alterY + (emptyRows + 1) * rowHeight + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Faculty Signature:', tableX, signatureY);
    doc.text('Forwarded by HOD:', tableX + 70, signatureY);
    doc.text('Approved by Principal:', tableX + 140, signatureY);

    doc.setFont('helvetica', 'normal');
    doc.text('__________________', tableX, signatureY + 12);
    doc.text('__________________', tableX + 70, signatureY + 12);
    doc.text('__________________', tableX + 140, signatureY + 12);

    // Save PDF
    doc.save(`leave_application_${details.faculty.empId}_${details.startDate}.pdf`);
};
