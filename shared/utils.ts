export function getShortName(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  if (nameParts.length === 2) {
    return fullName.trim();
  }
  
  const firstTwoNames = `${nameParts[0]} ${nameParts[1]}`;
  const lastName = nameParts[nameParts.length - 1];
  
  return `${firstTwoNames} ${lastName}`;
}

export function getFirstName(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return '';
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  return `${nameParts[0]} ${nameParts[1]}`;
}
