export function getShortName(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return `${firstName} ${lastName}`;
}
