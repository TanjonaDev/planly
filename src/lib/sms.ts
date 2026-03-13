import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_PHONE_NUMBER!;

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: FROM,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error };
  }
}

export async function sendVerificationCode(phone: string, code: string) {
  return sendSMS(
    phone,
    `Votre code Planly : ${code}\nCe code expire dans 5 minutes.`
  );
}

export async function sendAbsenceAlert(
  gerantPhone: string,
  employeeName: string,
  siteName: string,
  time: string
) {
  return sendSMS(
    gerantPhone,
    `⚠️ Absence : ${employeeName} ne pourra pas assurer la mission ${siteName} (${time}). Ouvrez l'app pour voir les remplaçants suggérés.`
  );
}

export async function sendReplacementRequest(
  employeePhone: string,
  employeeName: string,
  siteName: string,
  date: string,
  time: string
) {
  return sendSMS(
    employeePhone,
    `Bonjour ${employeeName}, pouvez-vous assurer le nettoyage à ${siteName} le ${date} de ${time} ? Répondez OUI ou NON.`
  );
}
