/*
 * Business Rule Engine (BRE)
 *
 * Lives on the SERVER only to prevent any kind of bypassing from frontend to ensure security.
 * All eligibility decisions must be authoritative from backend.
 *
 * Rules:
 *  1. Age must be between 23 and 50 (inclusive)
 *  2. Monthly salary must be >= ₹25,000
 *  3. PAN must match valid Indian PAN format: AAAAA9999A
 *  4. Employment mode must NOT be 'unemployed'
 */

export interface BREInput {
  dob: string | Date;
  monthlySalary: number;
  employmentMode: string;
  pan: string;
}

export interface BREResult {
  passed: boolean;
  reasons: string[];
}

// The below regex follow the correct format for Indian PAN numbers
/*
* - It starts with 5 uppercase alphabet
* - Followed by 4 digits
* - That is followed by a single uppercase Alphabet
*/
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// below function calculates the exact eligibility criterion of borrower by comparing Year, Month and Date of DOB and current
function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const reasons: string[] = [];

  // Rule 1: Age check
  const age = calculateAge(input.dob);
  if (age < 23 || age > 50) {
    reasons.push(
      `Age must be between 23 and 50 years. Your current age is ${age} years.`
    );
  }

  // Rule 2: Salary check
  if (input.monthlySalary < 25000) {
    reasons.push(
      `Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString('en-IN')}.`
    );
  }

  // Rule 3: PAN format validation
  const panUpper = input.pan.trim().toUpperCase();
  if (!PAN_REGEX.test(panUpper)) {
    reasons.push(
      `Invalid PAN format. Expected format: AAAAA9999A (5 letters, 4 digits, 1 letter in uppercase). Provided: "${input.pan}".`
    );
  }

  // Rule 4: Employment check
  if (input.employmentMode === 'unemployed') {
    reasons.push('Unemployed applicants are not eligible for a loan.');
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

/*
 * Simple Interest Calculation
 * SI = (P × R × T) / (365 × 100)
 * where T = tenure in days, R = annual rate (12%)
 */
export function calculateLoanMath(
  principal: number,
  tenureDays: number,
  ratePercent: number = 12
): { si: number; totalRepayment: number } {
  const si = (principal * ratePercent * tenureDays) / (365 * 100);
  const totalRepayment = principal + si;
  return {
    si: Math.round(si * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}