import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { getFirstAndLastName } from "@shared/utils";
import { getGravatarUrl } from "@shared/schema";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper function to download image from URL and return as Buffer
async function downloadImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image from ${imageUrl}: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error);
    return null;
  }
}

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
      from: "UMP Emaús <suporte@emausvota.com.br>" ,
      to: email,
      subject: "Seu código de verificação - UMP Emaús",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFA500;">UMP Emaús</h2>
          <p>Olá,</p>
          <p>Seu código de verificação para primeiro acesso é:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #FFA500; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p>Este código expira em 15 minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">UMP Emaús</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Password reset code for ${email}: ${code}`);
    return false;
  }
  
  try {
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: email,
      subject: "🔒 Recuperação de Senha - UMP Emaús",
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;">Recuperação de Senha</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Olá!</p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Você solicitou a recuperação de senha para sua conta no sistema UMP Emaús.
            </p>

            <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 20px;">
              Use o código abaixo para recuperar sua senha:
            </p>

            <!-- Code Card -->
            <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 100%); border-left: 4px solid #FFA500; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Código de Recuperação</p>
              <h1 style="color: #FFA500; margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: bold;">${code}</h1>
            </div>

            <div style="background-color: #FFF3CD; border-left: 4px solid #FFA500; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏱️ Atenção:</strong> Este código expira em <strong>15 minutos</strong>.
              </p>
            </div>

            <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 25px;">
              Após inserir o código, você será solicitado a criar uma nova senha para sua conta.
            </p>

            <p style="font-size: 14px; color: #888; line-height: 1.6; margin-top: 25px; padding-top: 25px; border-top: 1px solid #eee;">
              <strong>Não solicitou esta recuperação?</strong><br>
              Se você não solicitou a recuperação de senha, ignore este email. Sua senha atual permanecerá inalterada.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 100px; height: auto; margin-bottom: 15px;" />` : ''}
            <p style="color: #888; font-size: 14px; margin: 0 0 15px 0;">
              UMP Emaús
            </p>
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Este é um email automático, por favor não responda.
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
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

export async function sendBirthdayEmail(
  memberName: string,
  memberEmail: string,
  photoUrl: string | null
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Birthday email for ${memberEmail}: ${memberName}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(memberName);
    
    // Note: Photo download removed - plain text emails without attachments
    // have better deliverability and are less likely to be filtered as promotional
    
    // Plain text version for better deliverability (Gmail Primary inbox)
    // OPTIMIZED: Removed emojis, promotional language, and simplified for Primary inbox
    const plainText = `
Ola, ${formattedName}!

Hoje e um dia muito especial - e o seu aniversario!

Toda a UMP Emaus se une para celebrar este momento com voce e desejar muitas alegrias, bencaos e realizacoes neste novo ciclo que se inicia.

"Que o Senhor te abencoe e te guarde; que o Senhor faca resplandecer o seu rosto sobre ti e te conceda graca" - Numeros 6:24-25

Que este novo ano de vida seja repleto de saude, paz, amor e muita alegria ao lado de Deus e de todos que voce ama!

Com carinho,
Toda a familia UMP Emaus
    `.trim();

    // OPTIMIZED HTML for Gmail Primary inbox:
    // - Removed emojis (triggers promotional filter)
    // - Simplified HTML structure (less marketing-like)
    // - Personal sender format "Nome from UMP" 
    // - Minimal styling, no gradients
    // - No links/CTAs (personal emails don't have CTAs)
    // - Subject line without promotional words
    const emailPayload: any = {
      from: "UMP Emaus <suporte@emausvota.com.br>",
      replyTo: "suporte@emausvota.com.br",
      to: memberEmail,
      subject: `Feliz aniversario, ${formattedName}`,
      text: plainText,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
          
          <!-- Personal Greeting -->
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            Ola, <strong>${formattedName}</strong>!
          </p>
          
          <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 20px 0;">
            Hoje e um dia muito especial - e o seu aniversario!
          </p>
          
          <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 25px 0;">
            Toda a UMP Emaus se une para celebrar este momento com voce e desejar muitas alegrias, bencaos e realizacoes neste novo ciclo que se inicia.
          </p>

          <!-- Bible Verse - Simple quote style -->
          <div style="border-left: 3px solid #FFA500; padding-left: 15px; margin: 25px 0;">
            <p style="margin: 0 0 8px 0; color: #555; font-size: 15px; font-style: italic; line-height: 1.6;">
              "Que o Senhor te abencoe e te guarde; que o Senhor faca resplandecer o seu rosto sobre ti e te conceda graca"
            </p>
            <p style="margin: 0; color: #888; font-size: 13px;">
              Numeros 6:24-25
            </p>
          </div>

          <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 25px 0 20px 0;">
            Que este novo ano de vida seja repleto de saude, paz, amor e muita alegria ao lado de Deus e de todos que voce ama!
          </p>
          
          <p style="font-size: 15px; color: #333; margin: 20px 0 5px 0;">
            Com carinho,
          </p>
          <p style="font-size: 15px; color: #333; margin: 0;">
            <strong>Toda a familia UMP Emaus</strong>
          </p>

        </div>
      `,
    };

    // No attachments for better deliverability - CID images can trigger promotional filters
    // Personal emails typically don't have logos or multiple images

    await resend.emails.send(emailPayload);
    console.log(`✓ Birthday email sent to ${formattedName} (${memberEmail}) - optimized for Primary inbox`);
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
  const formattedName = getFirstAndLastName(candidateName);
  
  try {
    // Prepare email payload with CID-embedded logo (Gmail-compatible method)
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: candidateEmail,
      subject: `Parabéns! Você foi eleito(a) - Emaús Vota`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: Emaús Vota</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Parabéns!</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Olá, <strong>${formattedName}</strong>!</p>
            
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
              UMP Emaús
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
    
    console.log(`✓ Congratulations email sent to ${formattedName} (${candidateEmail}) for ${positionName}`);
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
    const formattedName = getFirstAndLastName(presidentName);
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: presidentEmail,
      subject: `Relatório de Auditoria - ${electionName}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: Emaús Vota</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Relatório de Auditoria</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Olá, <strong>${formattedName}</strong>!</p>
            
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
              UMP Emaús
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
    
    console.log(`✓ Audit PDF email sent to ${formattedName} (${presidentEmail}) for ${electionName}`);
    return true;
  } catch (error) {
    console.error("Error sending audit PDF email:", error);
    return false;
  }
}

// ==================== NOTIFICATION EMAILS ====================

export async function sendNewPrayerRequestEmail(
  recipientEmail: string,
  recipientName: string,
  requesterName: string,
  category: string,
  requestPreview: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] New prayer request notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    const preview = requestPreview.length > 150 ? requestPreview.substring(0, 150) + '...' : requestPreview;
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Novo Pedido de Oração - ${category}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #6B46C1 0%, #805AD5 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Mural de Oração</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Novo Pedido de Oração</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Um irmão da nossa comunidade enviou um pedido de oração. Vamos interceder juntos?
            </p>
            <div style="background-color: #F3E8FF; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #6B46C1; font-weight: bold; font-size: 14px;">Categoria: ${category}</p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">De: ${requesterName}</p>
              <p style="margin: 0; color: #555; font-size: 14px; font-style: italic;">"${preview}"</p>
            </div>
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Ore por este pedido e visite o Mural de Oração para ver mais pedidos.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/oracao" style="display: inline-block; background: linear-gradient(135deg, #6B46C1 0%, #805AD5 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ver Mural de Oração
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - Mural de Oração</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    console.log(`✓ Prayer request notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending prayer request notification email:", error);
    return false;
  }
}

export async function sendNewCommentEmail(
  recipientEmail: string,
  recipientName: string,
  commenterName: string,
  devotionalTitle: string,
  commentPreview: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] New comment notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    const preview = commentPreview.length > 150 ? commentPreview.substring(0, 150) + '...' : commentPreview;
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Novo Comentário em "${devotionalTitle}"`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: Espiritualidade</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Novo Comentário</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Um novo comentário foi recebido no devocional e precisa de aprovação:
            </p>
            <div style="background-color: #EFF6FF; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #2563EB; font-weight: bold; font-size: 14px;">Devocional: ${devotionalTitle}</p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">De: ${commenterName}</p>
              <p style="margin: 0; color: #555; font-size: 14px; font-style: italic;">"${preview}"</p>
            </div>
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Acesse o painel de espiritualidade para revisar e aprovar o comentário.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/admin/espiritualidade" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar Painel
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - Espiritualidade</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    console.log(`✓ Comment notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending comment notification email:", error);
    return false;
  }
}

export async function sendNewDevotionalEmail(
  recipientEmail: string,
  recipientName: string,
  devotionalTitle: string,
  devotionalId: number,
  imageUrl: string | null = null
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] New devotional notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const devotionalUrl = `${appUrl}/devocionais/${devotionalId}`;
    
    // Download devotional image if available
    let devotionalImageBuffer: Buffer | null = null;
    if (imageUrl) {
      devotionalImageBuffer = await downloadImageAsBuffer(imageUrl);
    }
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Novo Devocional: ${devotionalTitle}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: Espiritualidade</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Novo Devocional</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Um novo devocional foi publicado para você:
            </p>
            
            <!-- Devotional Card with Image -->
            <div style="background-color: #ECFDF5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              ${devotionalImageBuffer ? `
                <div style="margin-bottom: 15px;">
                  <img src="cid:devotional-image" alt="${devotionalTitle}" style="max-width: 100%; height: auto; border-radius: 8px;" />
                </div>
              ` : ''}
              <p style="margin: 0; color: #059669; font-weight: bold; font-size: 20px;">${devotionalTitle}</p>
            </div>
            
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Aproveite este momento de reflexão e crescimento espiritual!
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${devotionalUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ler Devocional
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - Espiritualidade</p>
          </div>
        </div>
      `,
    };

    const attachments: any[] = [];
    
    if (devotionalImageBuffer) {
      attachments.push({
        content: devotionalImageBuffer.toString('base64'),
        filename: 'devotional.jpg',
        contentId: 'devotional-image',
      });
    }
    
    if (logoBuffer) {
      attachments.push({
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      });
    }
    
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending devotional notification email:", error);
    return false;
  }
}

export async function sendNewEventEmail(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string | null,
  eventId: number,
  imageUrl: string | null = null
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] New event notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const eventUrl = `${appUrl}/agenda/${eventId}`;
    
    // Download event image if available
    let eventImageBuffer: Buffer | null = null;
    if (imageUrl) {
      eventImageBuffer = await downloadImageAsBuffer(imageUrl);
    }
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Novo Evento: ${eventTitle}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: Marketing</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Novo Evento</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Um novo evento foi adicionado à agenda:
            </p>
            
            <!-- Event Card with Image -->
            <div style="background-color: #FEF2F2; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              ${eventImageBuffer ? `
                <div style="margin-bottom: 15px;">
                  <img src="cid:event-image" alt="${eventTitle}" style="max-width: 100%; height: auto; border-radius: 8px;" />
                </div>
              ` : ''}
              <p style="margin: 0 0 10px 0; color: #DC2626; font-weight: bold; font-size: 20px;">${eventTitle}</p>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Data: ${eventDate}</p>
              ${eventLocation ? `<p style="margin: 0; color: #666; font-size: 14px;">Local: ${eventLocation}</p>` : ''}
            </div>
            
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Marque na sua agenda e participe!
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ver Evento
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - Marketing</p>
          </div>
        </div>
      `,
    };

    const attachments: any[] = [];
    
    if (eventImageBuffer) {
      attachments.push({
        content: eventImageBuffer.toString('base64'),
        filename: 'event.jpg',
        contentId: 'event-image',
      });
    }
    
    if (logoBuffer) {
      attachments.push({
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      });
    }
    
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending event notification email:", error);
    return false;
  }
}

export async function sendSeasonPublishedEmail(
  recipientEmail: string,
  recipientName: string,
  seasonTitle: string,
  seasonDescription: string | null,
  coverImageUrl: string | null = null
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Season published notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    // Download cover image if available
    let coverImageBuffer: Buffer | null = null;
    if (coverImageUrl) {
      coverImageBuffer = await downloadImageAsBuffer(coverImageUrl);
    }
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Nova Revista DeoGlory: ${seasonTitle}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: DeoGlory</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Nova Revista Disponível!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Uma nova revista de estudos está disponível no DeoGlory:
            </p>
            
            <!-- Magazine Card with Cover -->
            <div style="background-color: #FFF9E6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              ${coverImageBuffer ? `
                <div style="margin-bottom: 15px;">
                  <img src="cid:cover-image" alt="${seasonTitle}" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
                </div>
              ` : ''}
              <p style="margin: 0 0 10px 0; color: #FFA500; font-weight: bold; font-size: 20px;">${seasonTitle}</p>
              ${seasonDescription ? `<p style="margin: 0; color: #666; font-size: 14px;">${seasonDescription}</p>` : ''}
            </div>
            
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Comece seus estudos agora e ganhe XP!
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/study" style="display: inline-block; background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar DeoGlory
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - DeoGlory</p>
          </div>
        </div>
      `,
    };

    const attachments: any[] = [];
    
    if (coverImageBuffer) {
      attachments.push({
        content: coverImageBuffer.toString('base64'),
        filename: 'cover.jpg',
        contentId: 'cover-image',
      });
    }
    
    if (logoBuffer) {
      attachments.push({
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      });
    }
    
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending season published email:", error);
    return false;
  }
}

export async function sendSeasonEndedEmail(
  recipientEmail: string,
  recipientName: string,
  seasonTitle: string,
  lessonsCompleted: number,
  totalLessons: number,
  xpEarned: number,
  correctPercentage: number
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Season ended notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    const completionRate = Math.round((lessonsCompleted / totalLessons) * 100);
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Revista Finalizada: ${seasonTitle} - Seu Relatório`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: DeoGlory</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Revista Finalizada!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Parabéns, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              A revista "${seasonTitle}" chegou ao fim. Confira seu desempenho:
            </p>
            <div style="background-color: #F5F3FF; border-radius: 8px; padding: 25px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center; flex: 1;">
                  <p style="margin: 0; color: #7C3AED; font-size: 28px; font-weight: bold;">${lessonsCompleted}/${totalLessons}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Lições Completas</p>
                </div>
                <div style="text-align: center; flex: 1;">
                  <p style="margin: 0; color: #FFA500; font-size: 28px; font-weight: bold;">${xpEarned}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">XP Ganho</p>
                </div>
                <div style="text-align: center; flex: 1;">
                  <p style="margin: 0; color: #10B981; font-size: 28px; font-weight: bold;">${correctPercentage}%</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Acertos</p>
                </div>
              </div>
              <div style="background-color: #E9D5FF; height: 8px; border-radius: 4px; margin-top: 15px;">
                <div style="background-color: #7C3AED; height: 8px; border-radius: 4px; width: ${completionRate}%;"></div>
              </div>
              <p style="margin: 10px 0 0 0; text-align: center; color: #7C3AED; font-size: 14px; font-weight: bold;">${completionRate}% Completo</p>
            </div>
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Continue crescendo na Palavra! Novas revistas virão em breve.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/study" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar DeoGlory
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - DeoGlory</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending season ended email:", error);
    return false;
  }
}

export async function sendBonusEventEmail(
  recipientEmail: string,
  recipientName: string,
  eventName: string,
  eventDescription: string,
  bonusXp: number
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Bonus event notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Evento Especial DeoGlory: ${eventName}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: DeoGlory</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Evento Especial!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Um evento especial está acontecendo no DeoGlory:
            </p>
            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; color: #F59E0B; font-weight: bold; font-size: 18px;">${eventName}</p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${eventDescription}</p>
              ${bonusXp > 0 ? `<p style="margin: 0; color: #059669; font-weight: bold; font-size: 14px;">Bônus: +${bonusXp} XP</p>` : ''}
            </div>
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Não perca essa oportunidade de ganhar XP extra!
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/study" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar DeoGlory
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - DeoGlory</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending bonus event email:", error);
    return false;
  }
}

export async function sendLessonAvailableEmail(
  recipientEmail: string,
  recipientName: string,
  lessonTitle: string,
  seasonTitle: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Lesson available notification to ${recipientEmail}`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : (process.env.APP_URL || 'https://umpemaus.com.br');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Nova Lição: ${lessonTitle} - DeoGlory`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; opacity: 0.9; font-size: 12px; margin: 0 0 8px 0;">Módulo: DeoGlory</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Nova Lição Disponível!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá, <strong>${formattedName}</strong>!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Uma nova lição foi liberada para você estudar:
            </p>
            
            <!-- Lesson Card -->
            <div style="background-color: #EFF6FF; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #3B82F6; font-weight: bold; font-size: 20px;">${lessonTitle}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">Revista: ${seasonTitle}</p>
            </div>
            
            <p style="font-size: 15px; color: #555; margin-top: 20px; text-align: center;">
              Acesse o DeoGlory e continue sua jornada de aprendizado!
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${appUrl}/study" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Estudar Agora
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaús - DeoGlory</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending lesson available email:", error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return resend !== null;
}

export async function sendSeasonRankingEmail(
  recipientName: string,
  recipientEmail: string,
  seasonTitle: string,
  position: number,
  totalXp: number,
  podium: { name: string; position: number; xp: number }[]
): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL DISABLED] Season ranking email for ${recipientEmail} (position ${position})`);
    return false;
  }

  try {
    const formattedName = getFirstAndLastName(recipientName);
    
    const positionLabels: Record<number, { emoji: string; color: string; text: string }> = {
      1: { emoji: "", color: "#FFD700", text: "Primeiro Lugar" },
      2: { emoji: "", color: "#C0C0C0", text: "Segundo Lugar" },
      3: { emoji: "", color: "#CD7F32", text: "Terceiro Lugar" }
    };
    
    const positionInfo = positionLabels[position] || { emoji: "", color: "#888", text: `${position} Lugar` };
    
    const podiumHtml = podium.map((p, idx) => {
      const pInfo = positionLabels[p.position] || { emoji: "", color: "#888", text: `${p.position}` };
      const isWinner = p.position === position;
      return `
        <div style="display: flex; align-items: center; padding: 12px; margin: 8px 0; background-color: ${isWinner ? '#FFF9E6' : '#f5f5f5'}; border-radius: 8px; border: ${isWinner ? '2px solid #FFA500' : 'none'};">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${pInfo.color} 0%, ${pInfo.color}AA 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: white; margin-right: 12px;">
            ${p.position}
          </div>
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: ${isWinner ? 'bold' : 'normal'}; color: #333;">${p.name}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">${p.xp.toLocaleString('pt-BR')} XP</p>
          </div>
        </div>
      `;
    }).join('');
    
    const emailPayload: any = {
      from: "UMP Emaús <suporte@emausvota.com.br>",
      to: recipientEmail,
      subject: `Parabens! Voce ficou em ${position} lugar na revista ${seasonTitle}!`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, ${positionInfo.color} 0%, ${positionInfo.color}CC 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 60px; margin-bottom: 10px;">${positionInfo.emoji}</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${positionInfo.text}!
            </h1>
            <p style="color: #ffffff; opacity: 0.9; margin: 10px 0 0 0;">Revista: ${seasonTitle}</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 18px; color: #333; text-align: center;">
              Parabens, <strong>${formattedName}</strong>!
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6; text-align: center;">
              Voce concluiu a revista <strong>${seasonTitle}</strong> em <strong>${position} lugar</strong>
              com um total de <strong style="color: #FFA500;">${totalXp.toLocaleString('pt-BR')} XP</strong>!
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333; text-align: center; font-size: 16px;">Podio Final</h3>
              ${podiumHtml}
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6; text-align: center; margin-top: 20px;">
              Continue sua jornada de aprendizado no DeoGlory!
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
            ${logoBuffer ? `<img src="cid:logo-emaus" style="max-width: 80px; height: auto; margin-bottom: 10px;" />` : ''}
            <p style="color: #888; font-size: 12px; margin: 0;">UMP Emaus - DeoGlory</p>
          </div>
        </div>
      `,
    };

    if (logoBuffer) {
      emailPayload.attachments = [{
        content: logoBuffer.toString('base64'),
        filename: 'logo.png',
        contentId: 'logo-emaus',
      }];
    }

    await resend.emails.send(emailPayload);
    return true;
  } catch (error) {
    console.error("Error sending season ranking email:", error);
    return false;
  }
}
