import * as XLSX from 'xlsx';
import { MonthlySummary } from '../types';

export const generateSummaryCSV = (data: MonthlySummary[], month: string) => {
  // 1. Prepare data for the worksheet, ensuring a specific order of columns
  const tableHeader = [
    "Employee ID", "Name", "Department", "Designation",
    "Monthly Salary", "Present Days", "Permissions", "Half-Day Leaves",
    "Casual Leaves Available", "Casual Leaves Used", "Unpaid Leave",
    "Total Leaves", "Payable Days", "Calculated Salary"
  ];

  const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));

  const tableRows = sortedData.map(item => ({
    "Employee ID": item.empId,
    "Name": item.name,
    "Department": item.dept,
    "Designation": item.designation,
    "Monthly Salary": item.monthlySalary,
    "Present Days": item.presentDays,
    "Permissions": item.permissions,
    "Half-Day Leaves": item.halfDayLeaves,
    "Casual Leaves Available": item.casualLeavesAvailable,
    "Casual Leaves Used": item.casualLeavesUsed,
    "Unpaid Leave": item.unpaidLeave,
    "Total Leaves": item.totalLeaves.toFixed(1),
    "Payable Days": item.payableDays.toFixed(1),
    "Calculated Salary": item.calculatedSalary
  }));

  // 2. Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(tableRows, { header: tableHeader });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

  // 3. Trigger download
  const fileName = `attendance_summary_${month}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};