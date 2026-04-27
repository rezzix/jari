import TimesheetTab from '@/pages/reports/TimesheetTab';

export default function TimesheetsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Timesheets</h2>
      <TimesheetTab />
    </div>
  );
}