/**
 * Generates Google Calendar link and .ics downloadable file for Circle Cycle Deadlines
 */

export function getGoogleCalendarUrl({
  vaultName,
  amountUSDC,
  deadlineSeconds,
  vaultUrl,
}: {
  vaultName: string;
  amountUSDC: string;
  deadlineSeconds: number;
  vaultUrl: string;
}): string {
  const startDate = new Date(deadlineSeconds * 1000);
  // Set 1-hour window
  const endDate = new Date((deadlineSeconds + 3600) * 1000);

  const formatIsoForCalendar = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const startIso = formatIsoForCalendar(startDate);
  const endIso = formatIsoForCalendar(endDate);

  const title = encodeURIComponent(`Contribution Due: ${vaultName} ($${amountUSDC} USDC)`);
  const details = encodeURIComponent(
    `Your cycle contribution of $${amountUSDC} USDC is due for "${vaultName}" on Arc Mainnet.\n\nContribute on Arc: ${vaultUrl}`
  );
  const location = encodeURIComponent('Arc Mainnet (Chain 5042)');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function downloadIcsFile({
  vaultName,
  amountUSDC,
  deadlineSeconds,
  vaultUrl,
}: {
  vaultName: string;
  amountUSDC: string;
  deadlineSeconds: number;
  vaultUrl: string;
}) {
  const startDate = new Date(deadlineSeconds * 1000);
  const endDate = new Date((deadlineSeconds + 3600) * 1000);

  const formatIso = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GScoop Collaborative Savings//Arc Mainnet//EN',
    'BEGIN:VEVENT',
    `UID:gscoop-${deadlineSeconds}-${Math.random().toString(36).substring(2, 9)}@gscoop.xyz`,
    `DTSTAMP:${formatIso(new Date())}`,
    `DTSTART:${formatIso(startDate)}`,
    `DTEND:${formatIso(endDate)}`,
    `SUMMARY:Contribution Due: ${vaultName} ($${amountUSDC} USDC)`,
    `DESCRIPTION:Your cycle contribution of $${amountUSDC} USDC is due for ${vaultName} on Arc Mainnet.\\nContribute: ${vaultUrl}`,
    'LOCATION:Arc Mainnet (Chain 5042)',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${vaultName.replace(/\s+/g, '_')}_cycle_due.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
