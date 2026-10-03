export function canTeach(
  teacherGender: string | null,
  studentGender: string | null,
  birthDate: Date | null,
) {
  if (!teacherGender || !studentGender || !birthDate || birthDate > new Date())
    return false;
  return (
    (teacherGender === "MALE" && studentGender === "MALE") ||
    (teacherGender === "FEMALE" && studentGender === "FEMALE")
  );
}
export function overlaps(
  startA: Date,
  minutesA: number,
  startB: Date,
  minutesB: number,
) {
  return (
    startA.getTime() < startB.getTime() + minutesB * 60000 &&
    startB.getTime() < startA.getTime() + minutesA * 60000
  );
}
