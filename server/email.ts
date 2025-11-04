import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Read logo for CID embedding (Content-ID attachment method for Gmail compatibility)
// This method is more reliable than base64 data URIs which Gmail blocks
let logoBuffer: Buffer | null = null;
let logoPath = "";
try {
  logoPath = path.join(process.cwd(), "client", "public", "logo.png");
  logoBuffer = fs.readFileSync(logoPath);
  const sizeKB = Math.round(logoBuffer.length / 1024);
  console.log(`✓ Logo loaded successfully for CID email embedding from: ${logoPath}`);
  console.log(`  Logo size: ${sizeKB}KB (will be attached via CID for Gmail compatibility)`);
} catch (error) {
  console.error("Error loading logo for email:", error);
  console.error("Attempted path:", path.join(process.cwd(), "client", "public", "logo.png"));
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Verification code for ${email}: ${code}`);
    return false;
  }
  
  try {
    await resend.emails.send({
      from: "Emaús Vota <suporte@emausvota.com.br>" ,
      to: email,
      subject: "Seu código de verificação - Emaús Vota",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFA500;">Emaús Vota</h2>
          <p>Olá,</p>
          <p>Seu código de verificação é:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #FFA500; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p>Este código expira em 15 minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">UMP Emaús - Sistema de Votação</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendBirthdayEmail(
  memberName: string,
  memberEmail: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Birthday email for ${memberEmail}: ${memberName}`);
    return false;
  }

  try {
    const emailPayload: any = {
      from: "Emaús Vota <suporte@emausvota.com.br>",
      to: memberEmail,
      subject: `🎂 Feliz Aniversário! - UMP Emaús`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎂 Feliz Aniversário!</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Querido(a) <strong>${memberName}</strong>!</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Hoje é um dia muito especial! A família UMP Emaús deseja a você um feliz aniversário cheio de bênçãos, alegria e realizações.
            </p>

            <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 100%); border-left: 4px solid #FFA500; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 16px; text-align: center; font-style: italic;">
                "Que o Senhor te abençoe e te guarde"
              </p>
              <p style="margin: 10px 0 0 0; color: #FFA500; font-weight: bold; text-align: center; font-size: 14px;">
                Números 6:24
              </p>
            </div>

            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Que este novo ano de vida seja repleto de paz, amor e muita comunhão com Deus e com nossos irmãos!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 100px; height: auto; margin-bottom: 15px;" />` : ''}
            <p style="color: #888; font-size: 14px; margin: 0 0 15px 0;">
              UMP Emaús - Com carinho 💛
            </p>
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Este é um email automático, mas o carinho é verdadeiro!
            </p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [
        {
          content: logoBuffer.toString('base64'),
          filename: 'logo.png',
          contentId: 'logo-emaus',
        },
      ];
    }

    await resend.emails.send(emailPayload);
    console.log(`✓ Birthday email sent to ${memberName} (${memberEmail})`);
    return true;
  } catch (error) {
    console.error("Error sending birthday email:", error);
    return false;
  }
}

export async function sendCongratulationsEmail(
  candidateName: string, 
  candidateEmail: string,
  positionName: string, 
  scrutinyRound: number
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Congratulations email for ${candidateEmail}: ${candidateName} elected as ${positionName} in ${scrutinyRound}º scrutiny`);
    return false;
  }

  const ordinals = ["1º", "2º", "3º"];
  const scrutinyLabel = ordinals[scrutinyRound - 1] || `${scrutinyRound}º`;
  
  try {
    // Prepare email payload with CID-embedded logo (Gmail-compatible method)
    const emailPayload: any = {
      from: "Emaús Vota <suporte@emausvota.com.br>",
      to: candidateEmail,
      subject: `🎉 Parabéns! Você foi eleito(a) - Emaús Vota`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Parabéns!</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Olá, <strong>${candidateName}</strong>!</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              É com grande alegria que informamos que você foi eleito(a) para o cargo de:
            </p>

            <!-- Position Card -->
            <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 100%); border-left: 4px solid #FFA500; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h2 style="color: #FFA500; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">${positionName}</h2>
              <p style="margin: 0; color: #666; font-size: 14px;">Eleito no <strong>${scrutinyLabel} escrutínio</strong></p>
            </div>

            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-top: 25px;">
              Este é um momento de celebração e também de responsabilidade. Confiamos em você para servir com dedicação e amor ao próximo.
            </p>

            <!-- Bible Verse -->
            <div style="background-color: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; border: 2px solid #e9ecef;">
              <p style="font-style: italic; color: #555; font-size: 16px; line-height: 1.8; margin: 0;">
                "Porque de Deus somos cooperadores;<br/>
                lavoura de Deus, edifício de Deus sois vós."
              </p>
              <p style="color: #FFA500; font-weight: bold; margin: 15px 0 0 0; font-size: 14px;">
                1 Coríntios 3:9
              </p>
            </div>

            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Que Deus abençoe seu ministério e guie seus passos nesta nova jornada!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 100px; height: auto; margin-bottom: 15px;" />` : ''}
            <p style="color: #888; font-size: 14px; margin: 0 0 15px 0;">
              UMP Emaús - Sistema de Votação
            </p>
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </div>
      `,
    };

    // Add logo as CID attachment for Gmail compatibility (not blocked like base64)
    if (logoBuffer) {
      emailPayload.attachments = [
        {
          content: logoBuffer.toString('base64'),
          filename: 'logo.png',
          contentId: 'logo-emaus',
        },
      ];
    }

    await resend.emails.send(emailPayload);
    
    console.log(`✓ Congratulations email sent to ${candidateName} (${candidateEmail}) for ${positionName}`);
    return true;
  } catch (error) {
    console.error("Error sending congratulations email:", error);
    return false;
  }
}

export async function sendAuditPDFEmail(
  presidentName: string,
  presidentEmail: string,
  electionName: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Audit PDF email for ${presidentEmail}: ${presidentName} - ${electionName}`);
    return false;
  }

  try {
    const emailPayload: any = {
      from: "Emaús Vota <suporte@emausvota.com.br>",
      to: presidentEmail,
      subject: `📊 Relatório de Auditoria - ${electionName}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📊 Relatório de Auditoria</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Olá, <strong>${presidentName}</strong>!</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Segue anexo o relatório de auditoria completo da eleição:
            </p>

            <!-- Election Card -->
            <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 100%); border-left: 4px solid #FFA500; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h2 style="color: #FFA500; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">${electionName}</h2>
              <p style="margin: 0; color: #666; font-size: 14px;">Relatório completo de auditoria em PDF</p>
            </div>

            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-top: 25px;">
              Este relatório contém todos os detalhes da eleição, incluindo:
            </p>

            <ul style="color: #555; font-size: 15px; line-height: 1.8;">
              <li>Lista completa de presença</li>
              <li>Resultados por cargo e escrutínio</li>
              <li>Linha do tempo de votação</li>
              <li>Informações de auditoria</li>
            </ul>

            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-top: 25px;">
              Guarde este documento para seus registros oficiais.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 100px; height: auto; margin-bottom: 15px;" />` : ''}
            <p style="color: #888; font-size: 14px; margin: 0 0 15px 0;">
              UMP Emaús - Sistema de Votação
            </p>
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `Auditoria_${electionName.replace(/\s+/g, '_')}.pdf`,
          type: 'application/pdf',
        },
      ],
    };

    // Add logo as CID attachment
    if (logoBuffer) {
      emailPayload.attachments.push({
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      });
    }

    await resend.emails.send(emailPayload);
    
    console.log(`✓ Audit PDF email sent to ${presidentName} (${presidentEmail}) for ${electionName}`);
    return true;
  } catch (error) {
    console.error("Error sending audit PDF email:", error);
    return false;
  }
}
