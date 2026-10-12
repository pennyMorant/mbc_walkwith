export function membershipKey(groupId: string, userId: string) {
  return `${groupId}:${userId}`;
}

export function attendanceKey(groupId: string, meetingDate: string, userId: string) {
  return `${groupId}:${meetingDate}:${userId}`;
}
