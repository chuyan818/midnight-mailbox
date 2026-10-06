export function isSupportRequestValid(subject: string, message: string): boolean {
  return subject.trim().length >= 2 && message.trim().length >= 5;
}
